// src/types/search.ts
/**
 * Types for search functionality.
 */

export type SearchResultItem = {
  id: string;
  feed_title: string;
  feed_summary: string;
  detail_title: string | null;
  detail_brief: string | null;
  source_name: string;
  source_slug: string;
  source_url: string;
  feed_category: string | null;
  published_at: string; // ISO timestamp
  has_manipulative_content: boolean;
  rank: number | null;
};

export type FacetCount = {
  key: string;
  label: string;
  count: number;
};

export type SearchFacets = {
  categories: FacetCount[];
  sources: FacetCount[];
};

export type SearchSuggestionType = 'section' | 'publisher' | 'recent';

export type SearchSuggestion = {
  type: SearchSuggestionType;
  value: string;
  label: string;
  count: number | null;
};

export type SearchResponse = {
  query: string;
  total: number;
  limit: number;
  offset: number;
  items: SearchResultItem[];
  facets: SearchFacets;
  suggestions: SearchSuggestion[];
};

/**
 * Legacy single-value filters (deprecated, kept for backward compatibility)
 */
export type SearchFilters = {
  category: string | null;
  source: string | null;
  publishedAfter: string | null; // ISO timestamp
  publishedBefore: string | null; // ISO timestamp
  sort: 'relevance' | 'recency';
};

export type DateRangePreset = '24h' | 'week' | 'month' | 'all';

/**
 * V2 search filters with multi-value support.
 */
export type SearchFiltersV2 = {
  categories: string[];
  sources: string[];
  dateRange: DateRangePreset;
  sort: 'relevance' | 'recency';
};

/**
 * A single trending topic.
 */
export type TrendingTopic = {
  term: string;
  label: string;
  count: number;
  sample_headline: string | null;
};

/**
 * Response from the trending topics endpoint.
 */
export type TrendingTopicsResponse = {
  topics: TrendingTopic[];
  generated_at: string; // ISO timestamp
  window_hours: number;
};

/**
 * Extended saved search with badge count tracking.
 */
export type SavedSearchWithCount = {
  query: string;
  savedAt: string; // ISO timestamp
  lastCount: number; // Last known result count
  lastCountedAt: string; // ISO timestamp when count was fetched
};
