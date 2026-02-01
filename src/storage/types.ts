import type { Item, Brief } from '../types';

export type CachedBrief = {
  brief: Brief;
  cachedAt: string; // ISO timestamp when cached
  briefDate: string; // From brief.generated_at
};

export type SavedArticle = {
  item: Item;
  savedAt: string; // ISO timestamp
};

export type HistoryEntry = {
  item: Item;
  viewedAt: string; // ISO timestamp
};

export type TextSizePreference = 'small' | 'medium' | 'large';
export type ColorModePreference = 'light' | 'dark' | 'system';

export type UserPreferences = {
  topics: string[]; // Selected topic keys: 'world', 'us', 'local', 'business', 'technology', 'science', 'health', 'environment', 'sports', 'culture'
  textSize: TextSizePreference; // Reading text size preference
  colorMode: ColorModePreference; // Light/dark/system appearance
  hasSeenIntro?: boolean; // Whether user has seen the first-run onboarding screen
};

export type RecentSearch = {
  query: string;
  searchedAt: string; // ISO timestamp
};

// ============================================
// Reading Stats Types
// ============================================

import type { SpanReason } from '../navigation/types';

export type ReadingSession = {
  storyId: string;
  startedAt: string; // ISO timestamp
  endedAt: string | null;
  durationSeconds: number;
  maxScrollDepth: number; // 0-1 percentage
  completed: boolean; // true if dwell >= 30s OR scroll >= 75%
  localDate: string; // YYYY-MM-DD for grouping
};

export type ArticleSpanCache = {
  storyId: string;
  spanCount: number;
  byReason: Partial<Record<SpanReason, number>>;
  cachedAt: string; // ISO timestamp
};

export type UserStats = {
  version: number;
  ntrlDays: string[]; // Unique YYYY-MM-DD dates with completed sessions
  totalSessions: number;
  totalDurationSeconds: number;
  totalSpans: number;
  totalByReason: Partial<Record<SpanReason, number>>;
  firstSessionDate: string | null;
  lastUpdatedAt: string; // ISO timestamp
};

export type StatsTimeRange = 'day' | 'week' | 'month' | 'all';
