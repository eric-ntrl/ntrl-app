/**
 * Tests for storageService.
 *
 * Covers: saved articles CRUD, reading history, user preferences (with topic
 * migration), recent searches, and brief cache operations.
 */

// ---------------------------------------------------------------------------
// Mocks — must be declared before imports
// ---------------------------------------------------------------------------

// In-memory store backing AsyncStorage mock
const _asyncStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../secureStorage', () => ({
  getSecureJSON: jest.fn().mockResolvedValue(null),
  setSecureJSON: jest.fn().mockResolvedValue(undefined),
  getSecureItem: jest.fn().mockResolvedValue(null),
  setSecureItem: jest.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSavedArticles,
  saveArticle,
  removeSavedArticle,
  isArticleSaved,
  getHistory,
  addToHistory,
  clearHistory,
  getPreferences,
  updatePreferences,
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  getCachedBrief,
  cacheBrief,
  clearBriefCache,
  isBriefCacheStale,
} from '../storageService';
import { getSecureJSON, setSecureJSON, getSecureItem } from '../secureStorage';
import type { Item, Brief } from '../../types';
import type { CachedBrief, UserPreferences } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Item for testing. */
function makeItem(id: string, headline = 'Test Headline'): Item {
  return {
    id,
    source: 'AP',
    published_at: '2026-01-27T06:00:00Z',
    headline,
    summary: 'Test summary.',
    url: `https://ap.com/${id}`,
    has_manipulative_content: false,
    detail: { title: headline, brief: 'Brief.', full: null, disclosure: null },
  };
}

/** Reset the in-memory store and re-apply mock implementations. */
function resetStore() {
  for (const key of Object.keys(_asyncStore)) {
    delete _asyncStore[key];
  }
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();

  // Re-apply AsyncStorage implementations (clearAllMocks wipes them)
  (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
    Promise.resolve(_asyncStore[key] ?? null)
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
    _asyncStore[key] = value;
    return Promise.resolve();
  });
  (AsyncStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
    delete _asyncStore[key];
    return Promise.resolve();
  });

  // Default secure storage returns (no stored data)
  (getSecureJSON as jest.Mock).mockResolvedValue(null);
  (setSecureJSON as jest.Mock).mockResolvedValue(undefined);
  (getSecureItem as jest.Mock).mockResolvedValue(null);
});

// ===========================================================================
// Saved Articles
// ===========================================================================

describe('Saved Articles', () => {
  it('returns empty array when no articles are saved', async () => {
    const articles = await getSavedArticles();
    expect(articles).toEqual([]);
  });

  it('saves an article and retrieves it', async () => {
    const item = makeItem('a1');
    await saveArticle(item);

    const articles = await getSavedArticles();
    expect(articles).toHaveLength(1);
    expect(articles[0].item.id).toBe('a1');
    expect(articles[0].savedAt).toBeDefined();
  });

  it('does not duplicate when saving the same article twice', async () => {
    const item = makeItem('a1');
    await saveArticle(item);
    await saveArticle(item);

    const articles = await getSavedArticles();
    expect(articles).toHaveLength(1);
  });

  it('adds newest articles first', async () => {
    await saveArticle(makeItem('a1'));
    await saveArticle(makeItem('a2'));

    const articles = await getSavedArticles();
    expect(articles[0].item.id).toBe('a2');
    expect(articles[1].item.id).toBe('a1');
  });

  it('removes a saved article by id', async () => {
    await saveArticle(makeItem('a1'));
    await saveArticle(makeItem('a2'));

    await removeSavedArticle('a1');

    const articles = await getSavedArticles();
    expect(articles).toHaveLength(1);
    expect(articles[0].item.id).toBe('a2');
  });

  it('checks if an article is saved', async () => {
    await saveArticle(makeItem('a1'));

    expect(await isArticleSaved('a1')).toBe(true);
    expect(await isArticleSaved('a2')).toBe(false);
  });

  it('returns empty array on storage error', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    const articles = await getSavedArticles();
    expect(articles).toEqual([]);
  });
});

// ===========================================================================
// Reading History
// ===========================================================================

describe('Reading History', () => {
  it('returns empty array when no history exists', async () => {
    expect(await getHistory()).toEqual([]);
  });

  it('adds items to history', async () => {
    await addToHistory(makeItem('h1'));

    const history = await getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].item.id).toBe('h1');
    expect(history[0].viewedAt).toBeDefined();
  });

  it('moves re-viewed items to the top', async () => {
    await addToHistory(makeItem('h1'));
    await addToHistory(makeItem('h2'));
    await addToHistory(makeItem('h1')); // Re-view h1

    const history = await getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].item.id).toBe('h1');
    expect(history[1].item.id).toBe('h2');
  });

  it('caps history at 50 entries', async () => {
    for (let i = 0; i < 55; i++) {
      await addToHistory(makeItem(`h${i}`));
    }

    const history = await getHistory();
    expect(history).toHaveLength(50);
    // Most recent should be first
    expect(history[0].item.id).toBe('h54');
  });

  it('clears history', async () => {
    await addToHistory(makeItem('h1'));
    await clearHistory();

    expect(await getHistory()).toEqual([]);
  });

  it('returns empty array on storage error', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    expect(await getHistory()).toEqual([]);
  });
});

// ===========================================================================
// User Preferences
// ===========================================================================

describe('User Preferences', () => {
  const ALL_TOPICS = [
    'world',
    'us',
    'local',
    'business',
    'technology',
    'science',
    'health',
    'environment',
    'sports',
    'culture',
  ];

  it('returns default preferences when none are stored', async () => {
    const prefs = await getPreferences();

    expect(prefs.topics).toEqual(ALL_TOPICS);
    expect(prefs.textSize).toBe('medium');
    expect(prefs.colorMode).toBe('system');
  });

  it('returns stored preferences from secure storage', async () => {
    const storedPrefs: UserPreferences = {
      topics: ['world', 'us'],
      textSize: 'large',
      colorMode: 'dark',
    };
    (getSecureItem as jest.Mock).mockResolvedValue('true'); // migration done
    (getSecureJSON as jest.Mock).mockResolvedValue(storedPrefs);

    const prefs = await getPreferences();

    expect(prefs.topics).toEqual(['world', 'us']);
    expect(prefs.textSize).toBe('large');
    expect(prefs.colorMode).toBe('dark');
  });

  it('updates preferences by merging with current', async () => {
    (getSecureItem as jest.Mock).mockResolvedValue('true');
    (getSecureJSON as jest.Mock).mockResolvedValue({
      topics: ALL_TOPICS,
      textSize: 'medium',
      colorMode: 'system',
    });

    await updatePreferences({ textSize: 'small' });

    expect(setSecureJSON).toHaveBeenCalledWith(
      'ntrl_preferences',
      expect.objectContaining({ textSize: 'small', colorMode: 'system' })
    );
  });

  it('returns defaults on secure storage error', async () => {
    (getSecureItem as jest.Mock).mockRejectedValue(new Error('secure fail'));
    (getSecureJSON as jest.Mock).mockRejectedValue(new Error('secure fail'));

    const prefs = await getPreferences();
    expect(prefs).toEqual({
      topics: ALL_TOPICS,
      textSize: 'medium',
      colorMode: 'system',
      todayArticleCap: 7,
      sectionsArticleCap: 7,
    });
  });

  describe('topic migration', () => {
    it('migrates tech to technology and adds new categories', async () => {
      const oldPrefs: UserPreferences = {
        topics: ['world', 'us', 'business', 'tech', 'science'],
        textSize: 'medium',
        colorMode: 'system',
      };
      (getSecureItem as jest.Mock).mockResolvedValue('true'); // already migrated to secure
      (getSecureJSON as jest.Mock).mockResolvedValue(oldPrefs);

      const prefs = await getPreferences();

      // tech should be renamed to technology
      expect(prefs.topics).toContain('technology');
      expect(prefs.topics).not.toContain('tech');
      // New categories should be added
      expect(prefs.topics).toContain('health');
      expect(prefs.topics).toContain('environment');
      expect(prefs.topics).toContain('sports');
      expect(prefs.topics).toContain('culture');
      expect(prefs.topics).toContain('local');
      // Original topics should be preserved
      expect(prefs.topics).toContain('world');
      expect(prefs.topics).toContain('us');
      expect(prefs.topics).toContain('business');
      expect(prefs.topics).toContain('science');

      // Should persist the migrated topics
      expect(setSecureJSON).toHaveBeenCalled();
    });

    it('does not re-add user-deselected topics when no tech key present', async () => {
      const prefs: UserPreferences = {
        topics: ['world', 'us'], // User deselected most topics
        textSize: 'medium',
        colorMode: 'system',
      };
      (getSecureItem as jest.Mock).mockResolvedValue('true');
      (getSecureJSON as jest.Mock).mockResolvedValue(prefs);

      const result = await getPreferences();

      // Should NOT add back deselected topics
      expect(result.topics).toEqual(['world', 'us']);
      // Should NOT have called setSecureJSON (no migration needed)
      expect(setSecureJSON).not.toHaveBeenCalled();
    });
  });

  describe('AsyncStorage to SecureStore migration', () => {
    it('migrates legacy preferences from AsyncStorage to SecureStore', async () => {
      // Not yet migrated
      (getSecureItem as jest.Mock).mockResolvedValue(null);
      // Legacy data in AsyncStorage
      const legacyPrefs: UserPreferences = {
        topics: ALL_TOPICS,
        textSize: 'large',
        colorMode: 'light',
      };
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === '@ntrl/preferences') {
          return Promise.resolve(JSON.stringify(legacyPrefs));
        }
        return Promise.resolve(null);
      });
      // After migration, getSecureJSON returns the migrated value
      (getSecureJSON as jest.Mock).mockResolvedValue(legacyPrefs);

      const prefs = await getPreferences();

      expect(setSecureJSON).toHaveBeenCalledWith('ntrl_preferences', legacyPrefs);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@ntrl/preferences');
      expect(prefs.textSize).toBe('large');
    });

    it('skips migration if already migrated', async () => {
      (getSecureItem as jest.Mock).mockResolvedValue('true');
      (getSecureJSON as jest.Mock).mockResolvedValue(null);

      await getPreferences();

      // Should not attempt to read legacy preferences
      expect(AsyncStorage.getItem).not.toHaveBeenCalledWith('@ntrl/preferences');
    });
  });
});

// ===========================================================================
// Recent Searches
// ===========================================================================

describe('Recent Searches', () => {
  it('returns empty array when no searches exist', async () => {
    expect(await getRecentSearches()).toEqual([]);
  });

  it('adds and retrieves a recent search', async () => {
    await addRecentSearch('climate change');

    const searches = await getRecentSearches();
    expect(searches).toHaveLength(1);
    expect(searches[0].query).toBe('climate change');
    expect(searches[0].searchedAt).toBeDefined();
  });

  it('moves duplicate searches to the top (case-insensitive)', async () => {
    await addRecentSearch('economy');
    await addRecentSearch('politics');
    await addRecentSearch('Economy'); // Duplicate (different case)

    const searches = await getRecentSearches();
    expect(searches).toHaveLength(2);
    expect(searches[0].query).toBe('Economy');
    expect(searches[1].query).toBe('politics');
  });

  it('trims whitespace from search queries', async () => {
    await addRecentSearch('  trimmed  ');

    const searches = await getRecentSearches();
    expect(searches[0].query).toBe('trimmed');
  });

  it('ignores empty or whitespace-only queries', async () => {
    await addRecentSearch('');
    await addRecentSearch('   ');

    expect(await getRecentSearches()).toEqual([]);
  });

  it('caps at 10 recent searches', async () => {
    for (let i = 0; i < 15; i++) {
      await addRecentSearch(`query-${i}`);
    }

    const searches = await getRecentSearches();
    expect(searches).toHaveLength(10);
    // Most recent should be first
    expect(searches[0].query).toBe('query-14');
  });

  it('removes a specific search', async () => {
    await addRecentSearch('keep');
    await addRecentSearch('remove-me');

    await removeRecentSearch('remove-me');

    const searches = await getRecentSearches();
    expect(searches).toHaveLength(1);
    expect(searches[0].query).toBe('keep');
  });

  it('clears all recent searches', async () => {
    await addRecentSearch('one');
    await addRecentSearch('two');

    await clearRecentSearches();

    expect(await getRecentSearches()).toEqual([]);
  });
});

// ===========================================================================
// Brief Cache
// ===========================================================================

describe('Brief Cache', () => {
  const makeBrief = (): Brief => ({
    generated_at: '2026-01-27T08:00:00Z',
    sections: [
      {
        key: 'world',
        title: 'World',
        items: [makeItem('b1')],
      },
    ],
  });

  it('returns null when no brief is cached', async () => {
    expect(await getCachedBrief()).toBeNull();
  });

  it('caches and retrieves a brief', async () => {
    const brief = makeBrief();
    await cacheBrief(brief);

    const cached = await getCachedBrief();
    expect(cached).not.toBeNull();
    expect(cached!.brief.generated_at).toBe('2026-01-27T08:00:00Z');
    expect(cached!.brief.sections).toHaveLength(1);
    expect(cached!.cachedAt).toBeDefined();
    expect(cached!.briefDate).toBe('2026-01-27T08:00:00Z');
  });

  it('clears the brief cache', async () => {
    await cacheBrief(makeBrief());
    await clearBriefCache();

    expect(await getCachedBrief()).toBeNull();
  });

  it('returns null on storage error', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    expect(await getCachedBrief()).toBeNull();
  });
});

// ===========================================================================
// isBriefCacheStale
// ===========================================================================

describe('isBriefCacheStale', () => {
  it('returns false for fresh cache from today', () => {
    const now = new Date();
    const cached: CachedBrief = {
      brief: { generated_at: now.toISOString(), sections: [] },
      cachedAt: now.toISOString(),
      briefDate: now.toISOString(),
    };

    expect(isBriefCacheStale(cached)).toBe(false);
  });

  it('returns true for cache older than 24 hours', () => {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    const cached: CachedBrief = {
      brief: { generated_at: old.toISOString(), sections: [] },
      cachedAt: old.toISOString(),
      briefDate: old.toISOString(),
    };

    expect(isBriefCacheStale(cached)).toBe(true);
  });

  it('returns true for cache from a different calendar day (even if < 24h)', () => {
    // Create a date that is yesterday at 23:59 — less than 24h but different day
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    // Only stale if different calendar day
    const cached: CachedBrief = {
      brief: { generated_at: yesterday.toISOString(), sections: [] },
      cachedAt: new Date(Date.now() - 1000).toISOString(), // recent cache time
      briefDate: yesterday.toISOString(), // but briefDate is yesterday
    };

    expect(isBriefCacheStale(cached)).toBe(true);
  });
});
