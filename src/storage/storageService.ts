import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Item, Brief } from '../types';
import type {
  SavedArticle,
  HistoryEntry,
  UserPreferences,
  RecentSearch,
  SavedSearch,
  CachedBrief,
  ReadingSession,
  ArticleSpanCache,
  UserStats,
  PersistedSearchFilters,
} from './types';
import type { SearchFiltersV2 } from '../types/search';
import { getSecureJSON, setSecureJSON, getSecureItem } from './secureStorage';

// Storage keys - AsyncStorage (non-sensitive, larger data)
const KEYS = {
  SAVED_ARTICLES: '@ntrl/saved_articles',
  HISTORY: '@ntrl/history',
  PREFERENCES: '@ntrl/preferences', // Legacy key for migration
  RECENT_SEARCHES: '@ntrl/recent_searches',
  SAVED_SEARCHES: '@ntrl/saved_searches',
  CACHED_BRIEF: '@ntrl/cached_brief',
  LAST_SESSION_COMPLETED_AT: '@ntrl/last_session_completed_at',
  LAST_OPENED_AT: '@ntrl/last_opened_at',
  // Reading stats
  READING_SESSIONS: '@ntrl/reading_sessions',
  ARTICLE_SPAN_CACHE: '@ntrl/article_span_cache',
  USER_STATS: '@ntrl/user_stats',
  // Search filters
  SEARCH_FILTERS: '@ntrl/search_filters',
};

// Secure storage keys (sensitive data)
const SECURE_KEYS = {
  PREFERENCES: 'ntrl_preferences',
  MIGRATED: 'ntrl_preferences_migrated',
};

// Limits
const HISTORY_MAX_ENTRIES = 50;
const RECENT_SEARCHES_MAX = 10;
const SAVED_SEARCHES_MAX = 20;
const READING_SESSIONS_MAX = 200;
const ARTICLE_SPAN_CACHE_MAX = 100;

// ============================================
// Saved Articles
// ============================================

export async function getSavedArticles(): Promise<SavedArticle[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.SAVED_ARTICLES);
    if (!json) return [];
    return JSON.parse(json) as SavedArticle[];
  } catch (error) {
    console.warn('[Storage] Failed to get saved articles:', error);
    return [];
  }
}

export async function saveArticle(item: Item): Promise<void> {
  try {
    const saved = await getSavedArticles();
    // Check if already saved
    if (saved.some((s) => s.item.id === item.id)) {
      return;
    }
    const newEntry: SavedArticle = {
      item,
      savedAt: new Date().toISOString(),
    };
    // Add to beginning (newest first)
    saved.unshift(newEntry);
    await AsyncStorage.setItem(KEYS.SAVED_ARTICLES, JSON.stringify(saved));
  } catch (error) {
    console.warn('[Storage] Failed to save article:', error);
  }
}

export async function removeSavedArticle(itemId: string): Promise<void> {
  try {
    const saved = await getSavedArticles();
    const filtered = saved.filter((s) => s.item.id !== itemId);
    await AsyncStorage.setItem(KEYS.SAVED_ARTICLES, JSON.stringify(filtered));
  } catch (error) {
    console.warn('[Storage] Failed to remove saved article:', error);
  }
}

export async function isArticleSaved(itemId: string): Promise<boolean> {
  try {
    const saved = await getSavedArticles();
    return saved.some((s) => s.item.id === itemId);
  } catch (error) {
    console.warn('[Storage] Failed to check saved status:', error);
    return false;
  }
}

export async function clearAllSavedArticles(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.SAVED_ARTICLES);
  } catch (error) {
    console.warn('[Storage] Failed to clear all saved articles:', error);
  }
}

// ============================================
// Reading History
// ============================================

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.HISTORY);
    if (!json) return [];
    return JSON.parse(json) as HistoryEntry[];
  } catch (error) {
    console.warn('[Storage] Failed to get history:', error);
    return [];
  }
}

export async function addToHistory(item: Item): Promise<void> {
  try {
    let history = await getHistory();
    // Remove if already exists (will re-add at top)
    history = history.filter((h) => h.item.id !== item.id);
    const newEntry: HistoryEntry = {
      item,
      viewedAt: new Date().toISOString(),
    };
    // Add to beginning
    history.unshift(newEntry);
    // Cap at max entries
    if (history.length > HISTORY_MAX_ENTRIES) {
      history = history.slice(0, HISTORY_MAX_ENTRIES);
    }
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  } catch (error) {
    console.warn('[Storage] Failed to add to history:', error);
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.HISTORY);
  } catch (error) {
    console.warn('[Storage] Failed to clear history:', error);
  }
}

export async function removeHistoryEntry(itemId: string): Promise<void> {
  try {
    const history = await getHistory();
    const filtered = history.filter((h) => h.item.id !== itemId);
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(filtered));
  } catch (error) {
    console.warn('[Storage] Failed to remove history entry:', error);
  }
}

// ============================================
// User Preferences (Stored in SecureStore)
// ============================================

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

const DEFAULT_PREFERENCES: UserPreferences = {
  topics: [...ALL_TOPICS], // All 10 categories enabled by default
  textSize: 'medium', // Default reading text size
  colorMode: 'system', // Follow device appearance by default
  todayArticleCap: 7, // Default articles shown in Today feed
  sectionsArticleCap: 7, // Default articles shown per section in Sections feed
};

/**
 * Migrate topic preferences from old format to new:
 * - Rename 'tech' → 'technology'
 * - Add new categories (only when migrating from old 5-topic format)
 *
 * Returns null if no migration is needed (avoids re-adding user-deselected topics).
 */
function migrateTopics(topics: string[]): string[] | null {
  const hadTech = topics.includes('tech');
  // Rename tech → technology
  let migrated = topics.map((t) => (t === 'tech' ? 'technology' : t));

  // Only add new categories if we detected an old-format preference (had 'tech')
  if (hadTech) {
    for (const t of ALL_TOPICS) {
      if (!migrated.includes(t)) {
        migrated.push(t);
      }
    }
  }

  // Return null if nothing changed (no migration needed)
  if (migrated.length === topics.length && migrated.every((t, i) => t === topics[i])) {
    return null;
  }
  return migrated;
}

/**
 * Migrates preferences from AsyncStorage to SecureStore (one-time migration).
 * This ensures existing users' preferences are preserved when upgrading.
 */
async function migratePreferencesToSecureStore(): Promise<void> {
  try {
    // Check if already migrated
    const migrated = await getSecureItem(SECURE_KEYS.MIGRATED);
    if (migrated === 'true') return;

    // Check for existing AsyncStorage preferences
    const legacyJson = await AsyncStorage.getItem(KEYS.PREFERENCES);
    if (legacyJson) {
      const legacyPrefs = JSON.parse(legacyJson) as UserPreferences;
      await setSecureJSON(SECURE_KEYS.PREFERENCES, legacyPrefs);
      // Clean up legacy storage after successful migration
      await AsyncStorage.removeItem(KEYS.PREFERENCES);
    }

    // Mark as migrated (use setSecureItem directly to avoid circular import)
    const { setSecureItem } = await import('./secureStorage');
    await setSecureItem(SECURE_KEYS.MIGRATED, 'true');
  } catch (error) {
    console.warn('[Storage] Migration failed, will retry on next launch:', error);
  }
}

export async function getPreferences(): Promise<UserPreferences> {
  try {
    // Ensure migration has happened
    await migratePreferencesToSecureStore();

    // Get from SecureStore
    const prefs = await getSecureJSON<UserPreferences>(SECURE_KEYS.PREFERENCES);
    if (!prefs) return DEFAULT_PREFERENCES;

    // Migrate topics if needed (tech → technology rename)
    const migratedTopics = migrateTopics(prefs.topics);
    if (migratedTopics) {
      // Topics were migrated — persist the change
      const updated = { ...prefs, topics: migratedTopics };
      await setSecureJSON(SECURE_KEYS.PREFERENCES, updated);
      return updated;
    }

    return prefs;
  } catch (error) {
    console.warn('[Storage] Failed to get preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await getPreferences();
    const updated = { ...current, ...prefs };
    await setSecureJSON(SECURE_KEYS.PREFERENCES, updated);
  } catch (error) {
    console.warn('[Storage] Failed to update preferences:', error);
  }
}

// ============================================
// Recent Searches
// ============================================

export async function getRecentSearches(): Promise<RecentSearch[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.RECENT_SEARCHES);
    if (!json) return [];
    return JSON.parse(json) as RecentSearch[];
  } catch (error) {
    console.warn('[Storage] Failed to get recent searches:', error);
    return [];
  }
}

export async function addRecentSearch(query: string): Promise<void> {
  try {
    const trimmed = query.trim();
    if (!trimmed) return;

    let searches = await getRecentSearches();
    // Remove if already exists
    searches = searches.filter((s) => s.query.toLowerCase() !== trimmed.toLowerCase());
    const newEntry: RecentSearch = {
      query: trimmed,
      searchedAt: new Date().toISOString(),
    };
    // Add to beginning
    searches.unshift(newEntry);
    // Cap at max
    if (searches.length > RECENT_SEARCHES_MAX) {
      searches = searches.slice(0, RECENT_SEARCHES_MAX);
    }
    await AsyncStorage.setItem(KEYS.RECENT_SEARCHES, JSON.stringify(searches));
  } catch (error) {
    console.warn('[Storage] Failed to add recent search:', error);
  }
}

export async function removeRecentSearch(query: string): Promise<void> {
  try {
    const searches = await getRecentSearches();
    const filtered = searches.filter((s) => s.query !== query);
    await AsyncStorage.setItem(KEYS.RECENT_SEARCHES, JSON.stringify(filtered));
  } catch (error) {
    console.warn('[Storage] Failed to remove recent search:', error);
  }
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.RECENT_SEARCHES);
  } catch (error) {
    console.warn('[Storage] Failed to clear recent searches:', error);
  }
}

// ============================================
// Saved Searches
// ============================================

export async function getSavedSearches(): Promise<SavedSearch[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.SAVED_SEARCHES);
    if (!json) return [];
    return JSON.parse(json) as SavedSearch[];
  } catch (error) {
    console.warn('[Storage] Failed to get saved searches:', error);
    return [];
  }
}

export async function addSavedSearch(query: string): Promise<void> {
  try {
    const trimmed = query.trim();
    if (!trimmed) return;

    let searches = await getSavedSearches();
    // Check if already saved (case-insensitive)
    if (searches.some((s) => s.query.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    const newEntry: SavedSearch = {
      query: trimmed,
      savedAt: new Date().toISOString(),
    };
    // Add to beginning
    searches.unshift(newEntry);
    // Cap at max
    if (searches.length > SAVED_SEARCHES_MAX) {
      searches = searches.slice(0, SAVED_SEARCHES_MAX);
    }
    await AsyncStorage.setItem(KEYS.SAVED_SEARCHES, JSON.stringify(searches));
  } catch (error) {
    console.warn('[Storage] Failed to add saved search:', error);
  }
}

export async function removeSavedSearch(query: string): Promise<void> {
  try {
    const searches = await getSavedSearches();
    const filtered = searches.filter((s) => s.query !== query);
    await AsyncStorage.setItem(KEYS.SAVED_SEARCHES, JSON.stringify(filtered));
  } catch (error) {
    console.warn('[Storage] Failed to remove saved search:', error);
  }
}

export async function clearSavedSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.SAVED_SEARCHES);
  } catch (error) {
    console.warn('[Storage] Failed to clear saved searches:', error);
  }
}

export async function isSearchSaved(query: string): Promise<boolean> {
  try {
    const searches = await getSavedSearches();
    return searches.some((s) => s.query.toLowerCase() === query.toLowerCase());
  } catch (error) {
    console.warn('[Storage] Failed to check saved search status:', error);
    return false;
  }
}

// ============================================
// Saved Search Badge Counts
// ============================================

const KEYS_SEARCH_COUNTS = '@ntrl/saved_search_counts';

/**
 * Get saved search count cache for badge display.
 * Returns a map of query -> { count, countedAt }
 */
export async function getSavedSearchCounts(): Promise<
  Record<string, { count: number; countedAt: string }>
> {
  try {
    const json = await AsyncStorage.getItem(KEYS_SEARCH_COUNTS);
    if (!json) return {};
    return JSON.parse(json);
  } catch (error) {
    console.warn('[Storage] Failed to get saved search counts:', error);
    return {};
  }
}

/**
 * Update the cached count for a saved search.
 * Called after executing a saved search to track new article counts.
 */
export async function updateSavedSearchCount(query: string, count: number): Promise<void> {
  try {
    const counts = await getSavedSearchCounts();
    counts[query.toLowerCase()] = {
      count,
      countedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEYS_SEARCH_COUNTS, JSON.stringify(counts));
  } catch (error) {
    console.warn('[Storage] Failed to update saved search count:', error);
  }
}

/**
 * Get the cached count for a specific saved search.
 */
export async function getSavedSearchCount(
  query: string
): Promise<{ count: number; countedAt: string } | null> {
  try {
    const counts = await getSavedSearchCounts();
    return counts[query.toLowerCase()] || null;
  } catch (error) {
    console.warn('[Storage] Failed to get saved search count:', error);
    return null;
  }
}

/**
 * Remove count cache for a saved search (when search is removed).
 */
export async function removeSavedSearchCount(query: string): Promise<void> {
  try {
    const counts = await getSavedSearchCounts();
    delete counts[query.toLowerCase()];
    await AsyncStorage.setItem(KEYS_SEARCH_COUNTS, JSON.stringify(counts));
  } catch (error) {
    console.warn('[Storage] Failed to remove saved search count:', error);
  }
}

/**
 * Clear all saved search counts.
 */
export async function clearSavedSearchCounts(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS_SEARCH_COUNTS);
  } catch (error) {
    console.warn('[Storage] Failed to clear saved search counts:', error);
  }
}

// ============================================
// Session Timestamps (for TodayScreen filtering)
// ============================================

export async function getLastSessionCompletedAt(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.LAST_SESSION_COMPLETED_AT);
  } catch (error) {
    console.warn('[Storage] Failed to get last session completed at:', error);
    return null;
  }
}

export async function setLastSessionCompletedAt(iso: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LAST_SESSION_COMPLETED_AT, iso);
  } catch (error) {
    console.warn('[Storage] Failed to set last session completed at:', error);
  }
}

export async function getLastOpenedAt(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.LAST_OPENED_AT);
  } catch (error) {
    console.warn('[Storage] Failed to get last opened at:', error);
    return null;
  }
}

export async function setLastOpenedAt(iso: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LAST_OPENED_AT, iso);
  } catch (error) {
    console.warn('[Storage] Failed to set last opened at:', error);
  }
}

// ============================================
// Brief Cache (Offline Support)
// ============================================

const BRIEF_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedBrief(): Promise<CachedBrief | null> {
  try {
    const json = await AsyncStorage.getItem(KEYS.CACHED_BRIEF);
    if (!json) return null;
    return JSON.parse(json) as CachedBrief;
  } catch (error) {
    console.warn('[Storage] Failed to get cached brief:', error);
    return null;
  }
}

export async function cacheBrief(brief: Brief): Promise<void> {
  try {
    const cached: CachedBrief = {
      brief,
      cachedAt: new Date().toISOString(),
      briefDate: brief.generated_at,
    };
    await AsyncStorage.setItem(KEYS.CACHED_BRIEF, JSON.stringify(cached));
  } catch (error) {
    console.warn('[Storage] Failed to cache brief:', error);
  }
}

export async function clearBriefCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.CACHED_BRIEF);
  } catch (error) {
    console.warn('[Storage] Failed to clear brief cache:', error);
  }
}

export function isBriefCacheStale(cached: CachedBrief): boolean {
  const cachedTime = new Date(cached.cachedAt).getTime();
  const now = Date.now();

  // Stale if older than 24 hours
  if (now - cachedTime > BRIEF_CACHE_MAX_AGE_MS) {
    return true;
  }

  // Stale if from a different calendar day
  const cachedDate = new Date(cached.briefDate).toDateString();
  const todayDate = new Date().toDateString();
  if (cachedDate !== todayDate) {
    return true;
  }

  return false;
}

// ============================================
// Intro Screen (First-Run Onboarding)
// ============================================

export async function hasSeenIntro(): Promise<boolean> {
  const prefs = await getPreferences();
  return prefs.hasSeenIntro === true;
}

export async function markIntroSeen(): Promise<void> {
  await updatePreferences({ hasSeenIntro: true });
}

// ============================================
// Reading Sessions (Stats Tracking)
// ============================================

export async function getReadingSessions(): Promise<ReadingSession[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.READING_SESSIONS);
    if (!json) return [];
    return JSON.parse(json) as ReadingSession[];
  } catch (error) {
    console.warn('[Storage] Failed to get reading sessions:', error);
    return [];
  }
}

export async function addReadingSession(session: ReadingSession): Promise<void> {
  try {
    let sessions = await getReadingSessions();
    // Add to beginning (newest first)
    sessions.unshift(session);
    // Cap at max entries (rolling window)
    if (sessions.length > READING_SESSIONS_MAX) {
      sessions = sessions.slice(0, READING_SESSIONS_MAX);
    }
    await AsyncStorage.setItem(KEYS.READING_SESSIONS, JSON.stringify(sessions));
  } catch (error) {
    console.warn('[Storage] Failed to add reading session:', error);
  }
}

export async function clearReadingSessions(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.READING_SESSIONS);
  } catch (error) {
    console.warn('[Storage] Failed to clear reading sessions:', error);
  }
}

// ============================================
// Article Span Cache (for stats aggregation)
// ============================================

export async function getArticleSpanCache(): Promise<ArticleSpanCache[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.ARTICLE_SPAN_CACHE);
    if (!json) return [];
    return JSON.parse(json) as ArticleSpanCache[];
  } catch (error) {
    console.warn('[Storage] Failed to get article span cache:', error);
    return [];
  }
}

export async function getArticleSpanCacheEntry(storyId: string): Promise<ArticleSpanCache | null> {
  const cache = await getArticleSpanCache();
  return cache.find((e) => e.storyId === storyId) || null;
}

export async function setArticleSpanCacheEntry(entry: ArticleSpanCache): Promise<void> {
  try {
    let cache = await getArticleSpanCache();
    // Remove existing entry for this story if present
    cache = cache.filter((e) => e.storyId !== entry.storyId);
    // Add new entry at beginning
    cache.unshift(entry);
    // LRU eviction - keep only most recent entries
    if (cache.length > ARTICLE_SPAN_CACHE_MAX) {
      cache = cache.slice(0, ARTICLE_SPAN_CACHE_MAX);
    }
    await AsyncStorage.setItem(KEYS.ARTICLE_SPAN_CACHE, JSON.stringify(cache));
  } catch (error) {
    console.warn('[Storage] Failed to set article span cache entry:', error);
  }
}

// ============================================
// User Stats (Aggregated Totals)
// ============================================

const DEFAULT_USER_STATS: UserStats = {
  version: 1,
  ntrlDays: [],
  totalSessions: 0,
  totalDurationSeconds: 0,
  totalSpans: 0,
  totalByReason: {},
  firstSessionDate: null,
  lastUpdatedAt: new Date().toISOString(),
};

export async function getUserStats(): Promise<UserStats> {
  try {
    const json = await AsyncStorage.getItem(KEYS.USER_STATS);
    if (!json) return { ...DEFAULT_USER_STATS };
    return JSON.parse(json) as UserStats;
  } catch (error) {
    console.warn('[Storage] Failed to get user stats:', error);
    return { ...DEFAULT_USER_STATS };
  }
}

export async function setUserStats(stats: UserStats): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.USER_STATS, JSON.stringify(stats));
  } catch (error) {
    console.warn('[Storage] Failed to set user stats:', error);
  }
}

export async function clearUserStats(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.USER_STATS);
  } catch (error) {
    console.warn('[Storage] Failed to clear user stats:', error);
  }
}

/**
 * Weekly reading stats for Reading Insights section.
 */
export type WeeklyReadingStats = {
  weeklyMinutes: number;
  articlesCompleted: number;
  termsNeutralized: number;
  savedThisWeek: number;
  readThisWeek: number;
};

/**
 * Get aggregated reading stats for the past 7 days.
 * Used for the Reading Insights section on ProfileScreen.
 */
export async function getWeeklyReadingStats(): Promise<WeeklyReadingStats> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoISO = weekAgo.toISOString();

  try {
    // Get reading sessions from the past week
    const sessions = await getReadingSessions();
    const weeklySessions = sessions.filter((s) => s.startedAt >= weekAgoISO);

    // Calculate weekly minutes from session durations
    const weeklySeconds = weeklySessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    const weeklyMinutes = Math.round(weeklySeconds / 60);

    // Count completed articles
    const articlesCompleted = weeklySessions.filter((s) => s.completed).length;

    // Get span counts for completed sessions to calculate terms neutralized
    let termsNeutralized = 0;
    const spanCache = await getArticleSpanCache();
    for (const session of weeklySessions) {
      if (session.completed) {
        const cached = spanCache.find((c) => c.storyId === session.storyId);
        if (cached) {
          termsNeutralized += cached.spanCount;
        }
      }
    }

    // Count articles saved this week
    const savedArticles = await getSavedArticles();
    const savedThisWeek = savedArticles.filter((s) => s.savedAt >= weekAgoISO).length;

    // Count articles read (viewed) this week
    const history = await getHistory();
    const readThisWeek = history.filter((h) => h.viewedAt >= weekAgoISO).length;

    return {
      weeklyMinutes,
      articlesCompleted,
      termsNeutralized,
      savedThisWeek,
      readThisWeek,
    };
  } catch (error) {
    console.warn('[Storage] Failed to get weekly reading stats:', error);
    return {
      weeklyMinutes: 0,
      articlesCompleted: 0,
      termsNeutralized: 0,
      savedThisWeek: 0,
      readThisWeek: 0,
    };
  }
}

// ============================================
// Search Filters Persistence
// ============================================

const DEFAULT_SEARCH_FILTERS: SearchFiltersV2 = {
  categories: [],
  sources: [],
  dateRange: 'all',
  sort: 'relevance',
};

/**
 * Get persisted search filters.
 * Returns default filters if none are saved.
 * Handles migration from old format that had mode/selectedTopic fields.
 */
export async function getSearchFilters(): Promise<SearchFiltersV2> {
  try {
    const json = await AsyncStorage.getItem(KEYS.SEARCH_FILTERS);
    if (!json) return { ...DEFAULT_SEARCH_FILTERS };
    const persisted = JSON.parse(json);
    // Convert to SearchFiltersV2 (strip savedAt and legacy mode/selectedTopic fields)
    return {
      categories: persisted.categories || [],
      sources: persisted.sources || [],
      dateRange: persisted.dateRange || 'all',
      sort: persisted.sort || 'relevance',
    };
  } catch (error) {
    console.warn('[Storage] Failed to get search filters:', error);
    return { ...DEFAULT_SEARCH_FILTERS };
  }
}

/**
 * Save search filters to persistent storage.
 * Called when user applies filters.
 */
export async function saveSearchFilters(filters: SearchFiltersV2): Promise<void> {
  try {
    const persisted: PersistedSearchFilters = {
      ...filters,
      savedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEYS.SEARCH_FILTERS, JSON.stringify(persisted));
  } catch (error) {
    console.warn('[Storage] Failed to save search filters:', error);
  }
}

/**
 * Clear persisted search filters.
 * Called when user taps "Clear all".
 */
export async function clearSearchFilters(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.SEARCH_FILTERS);
  } catch (error) {
    console.warn('[Storage] Failed to clear search filters:', error);
  }
}
