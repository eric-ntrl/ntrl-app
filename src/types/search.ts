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

export type SearchFilters = {
  category: string | null;
  source: string | null;
  publishedAfter: string | null; // ISO timestamp
  publishedBefore: string | null; // ISO timestamp
  sort: 'relevance' | 'recency';
};

export type DateRangePreset = '24h' | 'week' | 'month' | 'all';

/**
 * Extended saved search with badge count tracking.
 */
export type SavedSearchWithCount = {
  query: string;
  savedAt: string; // ISO timestamp
  lastCount: number; // Last known result count
  lastCountedAt: string; // ISO timestamp when count was fetched
};
