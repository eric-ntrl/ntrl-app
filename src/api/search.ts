/**
 * Search API Client
 *
 * Provides functions for searching articles with full-text search,
 * faceted filtering, and auto-complete suggestions.
 *
 * @module api/search
 */

import { API_BASE_URL } from '../config';
import type {
  SearchResponse,
  SearchFilters,
  SearchFiltersV2,
  DateRangePreset,
} from '../types/search';

// Request configuration
const FETCH_TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000; // 1 second

/**
 * Delay execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable (network errors, 5xx server errors)
 */
function isRetryableError(error: unknown, response?: Response): boolean {
  // Network errors (no response)
  if (!response && error instanceof Error) {
    return true;
  }
  // Server errors (5xx)
  if (response && response.status >= 500) {
    return true;
  }
  // Request timeout
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  return false;
}

/**
 * Fetch with retry logic and exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add timeout to each request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Return successful responses (2xx) or client errors (4xx) immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error - may be retryable
      lastResponse = response;
      lastError = new Error(`HTTP ${response.status}`);

      if (!isRetryableError(lastError, response) || attempt === retries) {
        return response;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryableError(error, undefined) || attempt === retries) {
        throw lastError;
      }
    }

    // Exponential backoff: 1s, 2s
    const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
    await delay(delayMs);
  }

  // Should not reach here, but satisfy TypeScript
  if (lastResponse) return lastResponse;
  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Convert a date range preset to ISO timestamps.
 */
export function getDateRangeTimestamps(preset: DateRangePreset): {
  after: string | null;
  before: string | null;
} {
  if (preset === 'all') {
    return { after: null, before: null };
  }

  const now = new Date();
  let after: Date;

  switch (preset) {
    case '24h':
      after = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      after = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      after = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return { after: null, before: null };
  }

  return {
    after: after.toISOString(),
    before: null,
  };
}

/**
 * Build query string from search parameters (legacy single-value).
 */
function buildSearchUrl(
  query: string,
  filters: Partial<SearchFilters> = {},
  limit: number = 20,
  offset: number = 0
): string {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  if (filters.category) {
    params.set('category', filters.category);
  }
  if (filters.source) {
    params.set('source', filters.source);
  }
  if (filters.publishedAfter) {
    params.set('published_after', filters.publishedAfter);
  }
  if (filters.publishedBefore) {
    params.set('published_before', filters.publishedBefore);
  }
  if (filters.sort && filters.sort !== 'relevance') {
    params.set('sort', filters.sort);
  }

  return `${API_BASE_URL}/v1/search?${params.toString()}`;
}

/**
 * Build query string from V2 search parameters (multi-value support).
 */
function buildSearchUrlV2(
  query: string,
  filters: Partial<SearchFiltersV2> = {},
  limit: number = 20,
  offset: number = 0
): string {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  // Multi-value filters (comma-separated)
  if (filters.categories && filters.categories.length > 0) {
    params.set('categories', filters.categories.join(','));
  }
  if (filters.sources && filters.sources.length > 0) {
    params.set('sources', filters.sources.join(','));
  }

  // Date range
  if (filters.dateRange && filters.dateRange !== 'all') {
    const { after } = getDateRangeTimestamps(filters.dateRange);
    if (after) {
      params.set('published_after', after);
    }
  }

  // Sort
  if (filters.sort && filters.sort !== 'relevance') {
    params.set('sort', filters.sort);
  }

  return `${API_BASE_URL}/v1/search?${params.toString()}`;
}

/**
 * Search articles with full-text search.
 *
 * Returns matching articles sorted by relevance or recency,
 * with facet counts for filtering and suggestions for auto-complete.
 *
 * @param query - Search query string (min 2 characters)
 * @param filters - Optional filters (category, source, date range, sort)
 * @param limit - Results per page (default 20, max 50)
 * @param offset - Pagination offset (default 0)
 * @returns Promise resolving to SearchResponse with items, facets, and suggestions
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const results = await searchArticles('climate change', {
 *   category: 'environment',
 *   sort: 'recency',
 * });
 * console.log(`Found ${results.total} results`);
 * ```
 */
export async function searchArticles(
  query: string,
  filters: Partial<SearchFilters> = {},
  limit: number = 20,
  offset: number = 0
): Promise<SearchResponse> {
  // Validate query length
  if (query.trim().length < 2) {
    return {
      query,
      total: 0,
      limit,
      offset,
      items: [],
      facets: { categories: [], sources: [] },
      suggestions: [],
    };
  }

  const url = buildSearchUrl(query, filters, limit, offset);

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  const data: SearchResponse = await response.json();
  return data;
}

/**
 * Search articles with V2 multi-value filters.
 *
 * Returns matching articles sorted by relevance or recency,
 * with facet counts for filtering and suggestions for auto-complete.
 *
 * @param query - Search query string (min 2 characters)
 * @param filters - V2 filters (categories[], sources[], dateRange, sort)
 * @param limit - Results per page (default 20, max 50)
 * @param offset - Pagination offset (default 0)
 * @returns Promise resolving to SearchResponse with items, facets, and suggestions
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const results = await searchArticlesV2('climate change', {
 *   categories: ['environment', 'science'],
 *   sort: 'recency',
 * });
 * console.log(`Found ${results.total} results`);
 * ```
 */
export async function searchArticlesV2(
  query: string,
  filters: Partial<SearchFiltersV2> = {},
  limit: number = 20,
  offset: number = 0
): Promise<SearchResponse> {
  // Validate query length
  if (query.trim().length < 2) {
    return {
      query,
      total: 0,
      limit,
      offset,
      items: [],
      facets: { categories: [], sources: [] },
      suggestions: [],
    };
  }

  const url = buildSearchUrlV2(query, filters, limit, offset);

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  const data: SearchResponse = await response.json();
  return data;
}

/**
 * Get just the result count for a query (for badge updates).
 *
 * This is a lightweight call that returns only the total count,
 * used for updating saved search badges without fetching full results.
 *
 * @param query - Search query string
 * @returns Promise resolving to the total count
 */
export async function getSearchCount(query: string): Promise<number> {
  if (query.trim().length < 2) {
    return 0;
  }

  try {
    // Fetch with limit=0 to get just the count (backend should support this)
    const results = await searchArticles(query, {}, 1, 0);
    return results.total;
  } catch (error) {
    console.log('[Search] Failed to get count:', error);
    return 0;
  }
}
