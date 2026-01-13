import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Item } from '../types';
import type { SavedArticle, HistoryEntry, UserPreferences, RecentSearch } from './types';

// Storage keys
const KEYS = {
  SAVED_ARTICLES: '@ntrl/saved_articles',
  HISTORY: '@ntrl/history',
  PREFERENCES: '@ntrl/preferences',
  RECENT_SEARCHES: '@ntrl/recent_searches',
};

// Limits
const HISTORY_MAX_ENTRIES = 50;
const RECENT_SEARCHES_MAX = 10;

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

// ============================================
// User Preferences
// ============================================

const DEFAULT_PREFERENCES: UserPreferences = {
  topics: ['world', 'us', 'local', 'business', 'tech'], // All enabled by default
};

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const json = await AsyncStorage.getItem(KEYS.PREFERENCES);
    if (!json) return DEFAULT_PREFERENCES;
    return JSON.parse(json) as UserPreferences;
  } catch (error) {
    console.warn('[Storage] Failed to get preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await getPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(updated));
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
