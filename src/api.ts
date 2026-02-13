/**
 * NTRL API Client
 *
 * Provides functions for fetching data from the NTRL backend API.
 * Includes automatic retry logic, caching, and offline fallback support.
 *
 * @module api
 */

import { API_BASE_URL } from './config';
import type { Brief, Section, Item, Detail, TransparencySpan } from './types';
import { getCachedBrief, cacheBrief } from './storage/storageService';

// ============================================================================
// API Response Types (internal)
// ============================================================================
type ApiBriefStory = {
  id: string;
  // Feed outputs
  feed_title: string;
  feed_summary: string;
  source_name: string;
  source_url: string;
  publisher_url?: string | null;
  published_at: string;
  has_manipulative_content: boolean;
  position: number;
  // Detail outputs (embedded to eliminate N+1 calls)
  detail_title: string | null;
  detail_brief: string | null;
  detail_full: string | null;
  disclosure: string | null;
};

type ApiBriefSection = {
  name: string;
  display_name: string;
  order: number;
  stories: ApiBriefStory[];
};

type ApiBriefResponse = {
  id: string;
  brief_date: string;
  cutoff_time: string;
  assembled_at: string;
  sections: ApiBriefSection[];
};

type ApiStoryDetail = {
  id: string;
  // Feed outputs
  feed_title: string;
  feed_summary: string;
  // Detail outputs (new schema)
  detail_title: string | null;
  detail_brief: string | null;
  detail_full: string | null;
  // Metadata
  disclosure: string | null;
  has_manipulative_content: boolean;
  source_name: string;
  source_url: string;
  published_at: string;
  section: string | null;
};

type ApiTransparencySpan = {
  field: 'title' | 'body';
  start_char: number;
  end_char: number;
  original_text: string;
  action: string;
  reason: string;
  replacement_text: string | null;
};

type ApiTransparencyResponse = {
  id: string;
  // Original content (for transparency view)
  original_title: string;
  original_description: string | null;
  original_body: string | null;
  original_body_available: boolean;
  original_body_expired: boolean;
  // Filtered outputs
  feed_title: string;
  feed_summary: string;
  detail_full: string | null;
  // What was changed
  spans: ApiTransparencySpan[];
  // Metadata
  disclosure: string;
  has_manipulative_content: boolean;
  source_url: string;
};

// Transform API response to app types
function transformBrief(api: ApiBriefResponse): Brief {
  return {
    generated_at: api.assembled_at,
    sections: api.sections
      .map(
        (section): Section => ({
          key: section.name,
          title: section.display_name,
          items: section.stories
            // Filter out stories with empty titles (failed neutralization)
            .filter((story) => story.feed_title && story.feed_title.trim() !== '')
            .map(
              (story): Item => ({
                id: story.id,
                source: story.source_name,
                url: story.source_url,
                source_url: story.publisher_url || undefined,
                publisher_url: story.publisher_url || undefined,
                published_at: story.published_at,
                headline: story.feed_title || '',
                summary: story.feed_summary || '',
                has_manipulative_content: story.has_manipulative_content,
                // Detail fields now embedded from API (no N+1 calls needed)
                detail: {
                  title: story.detail_title || story.feed_title || '',
                  brief: story.detail_brief || story.feed_summary || '',
                  full: story.detail_full,
                  disclosure: story.disclosure,
                },
              })
            ),
        })
      )
      // Filter out empty sections
      .filter((section) => section.items.length > 0),
  };
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Fetch the daily brief from the API.
 *
 * Returns the current day's news brief with all sections and stories.
 * Does not use caching - for cached version use {@link fetchBriefWithCache}.
 *
 * @returns Promise resolving to the Brief data
 * @throws Error if the request fails or returns non-OK status
 *
 * @example
 * ```typescript
 * const brief = await fetchBrief();
 * console.log(brief.sections.length); // Number of news sections
 * ```
 */
export async function fetchBrief(): Promise<Brief> {
  // Use server-side 24h filtering to reduce payload size
  const response = await fetch(`${API_BASE_URL}/v1/brief?hours=24`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  const data: ApiBriefResponse = await response.json();
  return transformBrief(data);
}

/**
 * Result from a cache-aware brief fetch.
 * Indicates whether data came from network or local cache.
 */
export type BriefFetchResult = {
  /** The fetched brief data */
  brief: Brief;
  /** True if data was served from cache due to network failure */
  fromCache: boolean;
};

// Retry configuration
const FETCH_TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRIES = 3;
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

    // Exponential backoff: 1s, 2s, 4s
    const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
    await delay(delayMs);
  }

  // Should not reach here, but satisfy TypeScript
  if (lastResponse) return lastResponse;
  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Fetch the daily brief with automatic caching and offline fallback.
 *
 * This is the primary method for fetching briefs in the app. It:
 * 1. Attempts to fetch fresh data from the API
 * 2. Caches successful responses for offline use
 * 3. Falls back to cached data if network request fails
 *
 * @returns Promise resolving to BriefFetchResult with brief and cache status
 * @throws Error only if both network request and cache retrieval fail
 *
 * @example
 * ```typescript
 * const { brief, fromCache } = await fetchBriefWithCache();
 * if (fromCache) {
 *   console.log('Using cached data - you may be offline');
 * }
 * ```
 */
export async function fetchBriefWithCache(): Promise<BriefFetchResult> {
  // Get cached data first (for fallback)
  const cached = await getCachedBrief();

  try {
    // Attempt fresh fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    // Use server-side 24h filtering to reduce payload size
    const response = await fetch(`${API_BASE_URL}/v1/brief?hours=24`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // 404 means no brief available - return empty brief, don't fall back to cache
      if (response.status === 404) {
        return {
          brief: { generated_at: new Date().toISOString(), sections: [] },
          fromCache: false,
        };
      }
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }

    const data: ApiBriefResponse = await response.json();
    const brief = transformBrief(data);

    // Cache the fresh data (fire-and-forget)
    cacheBrief(brief).catch(() => {});

    return {
      brief,
      fromCache: false,
    };
  } catch (error) {
    // Network failed - fall back to cache if available
    if (cached) {
      console.log('[API] Network failed, using cached brief');
      return {
        brief: cached.brief,
        fromCache: true,
      };
    }

    // No cache available - rethrow the error
    throw error;
  }
}

/**
 * Fetch detailed information for a specific story.
 *
 * Returns structured detail including what happened, why it matters,
 * known facts, and uncertainties. Uses retry logic for resilience.
 *
 * @param storyId - The unique identifier of the story
 * @returns Promise resolving to the Detail data
 * @throws Error if request fails after all retries
 *
 * @example
 * ```typescript
 * const detail = await fetchStoryDetail('story-123');
 * console.log(detail.what_happened);
 * ```
 */
export async function fetchStoryDetail(storyId: string): Promise<Detail> {
  const response = await fetchWithRetry(`${API_BASE_URL}/v1/stories/${storyId}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: ApiStoryDetail = await response.json();
  return {
    title: data.detail_title || data.feed_title || '',
    brief: data.detail_brief || data.feed_summary || '',
    full: data.detail_full,
    disclosure: data.disclosure,
  };
}

/**
 * Result from fetching transparency data.
 */
export type TransparencyFetchResult = {
  /** Original article title (for headline manipulation highlighting) */
  originalTitle: string;
  /** Original article body text (for highlighting spans) */
  originalBody: string | null;
  /** Whether original body is available */
  originalBodyAvailable: boolean;
  /** Whether original body has expired */
  originalBodyExpired: boolean;
  /** Transparency spans for title */
  titleSpans: TransparencySpan[];
  /** Transparency spans for body */
  bodySpans: TransparencySpan[];
  /** All transparency spans (combined) */
  spans: TransparencySpan[];
  /** Original source URL */
  sourceUrl: string;
};

/**
 * Fetch transparency data showing what was changed in a story.
 *
 * Returns the original article body and transparency spans with details
 * about each manipulation that was identified and how it was neutralized.
 *
 * @param storyId - The unique identifier of the story
 * @returns Promise resolving to transparency data including original body and spans
 * @throws Error if request fails after all retries
 *
 * @example
 * ```typescript
 * const { originalBody, spans } = await fetchTransparency('story-123');
 * console.log(`${spans.length} manipulations were neutralized`);
 * ```
 */
export async function fetchTransparency(storyId: string): Promise<TransparencyFetchResult> {
  const response = await fetchWithRetry(
    `${API_BASE_URL}/v1/stories/${storyId}/transparency`,
    {},
    1 // Only 1 retry (2 attempts max) — transparency is non-critical
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: ApiTransparencyResponse = await Promise.race([
    response.json(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Body parse timeout')), 10000)
    ),
  ]);

  const allSpans = data.spans || [];
  const titleSpans = allSpans.filter((s) => s.field === 'title');
  const bodySpans = allSpans.filter((s) => s.field === 'body' || !s.field);

  return {
    originalTitle: data.original_title,
    originalBody: data.original_body,
    originalBodyAvailable: data.original_body_available,
    originalBodyExpired: data.original_body_expired,
    titleSpans,
    bodySpans,
    spans: allSpans,
    sourceUrl: data.source_url,
  };
}
