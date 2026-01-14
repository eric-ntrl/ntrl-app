import type { Item, Brief } from '../types';

export type CachedBrief = {
  brief: Brief;
  cachedAt: string;   // ISO timestamp when cached
  briefDate: string;  // From brief.generated_at
};

export type SavedArticle = {
  item: Item;
  savedAt: string; // ISO timestamp
};

export type HistoryEntry = {
  item: Item;
  viewedAt: string; // ISO timestamp
};

export type UserPreferences = {
  topics: string[]; // Selected topic keys: 'world', 'us', 'local', 'business', 'tech'
};

export type RecentSearch = {
  query: string;
  searchedAt: string; // ISO timestamp
};
