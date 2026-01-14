/**
 * NTRL API Client
 *
 * Provides functions for fetching data from the NTRL backend API.
 * Includes automatic retry logic, caching, and offline fallback support.
 *
 * @module api
 */

import { API_BASE_URL } from './config';
import type { Brief, Section, Item, Detail } from './types';
import { getCachedBrief, cacheBrief } from './storage/storageService';

// ============================================================================
// API Response Types (internal)
// ============================================================================
type ApiBriefStory = {
  id: string;
  // New field names (current API)
  feed_title?: string;
  feed_summary?: string;
  // Legacy field names (backwards compatibility)
  neutral_headline?: string;
  neutral_summary?: string;
  source_name: string;
  source_url: string;
  published_at: string;
  has_manipulative_content: boolean;
  position: number;
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
  // New field names (current API)
  feed_title?: string;
  feed_summary?: string;
  // Legacy field names (backwards compatibility)
  neutral_headline?: string;
  neutral_summary?: string;
  what_happened: string | null;
  why_it_matters: string | null;
  what_is_known: string[] | null;
  what_is_uncertain: string[] | null;
  disclosure: string | null;
  has_manipulative_content: boolean;
  source_name: string;
  source_url: string;
  published_at: string;
  section: string;
};

type ApiTransparencyResponse = {
  id: string;
  // New field names (current API)
  feed_title?: string;
  feed_summary?: string;
  // Legacy field names (backwards compatibility)
  neutral_headline?: string;
  neutral_summary?: string;
  removed_phrases: string[];
  source_name: string;
  source_url: string;
};

// Transform API response to app types
function transformBrief(api: ApiBriefResponse): Brief {
  return {
    generated_at: api.assembled_at,
    sections: api.sections.map(
      (section): Section => ({
        key: section.name,
        title: section.display_name,
        items: section.stories.map(
          (story): Item => ({
            id: story.id,
            source: story.source_name,
            source_url: story.source_url,
            published_at: story.published_at,
            // Support both new (feed_*) and legacy (neutral_*) field names
            headline: story.feed_title || story.neutral_headline || '',
            summary: story.feed_summary || story.neutral_summary || '',
            url: story.source_url,
            detail: {
              what_happened: '',
              why_it_matters: '',
              known: [],
              uncertain: [],
              removed: [],
            },
          })
        ),
      })
    ),
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
  const response = await fetch(`${API_BASE_URL}/v1/brief`);

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

    const response = await fetch(`${API_BASE_URL}/v1/brief`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
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
    what_happened: data.what_happened || '',
    why_it_matters: data.why_it_matters || '',
    known: data.what_is_known || [],
    uncertain: data.what_is_uncertain || [],
    removed: [],
  };
}

/**
 * Fetch transparency data showing what was removed from a story.
 *
 * Returns a list of phrases that were identified as manipulative
 * and removed during the neutralization process.
 *
 * @param storyId - The unique identifier of the story
 * @returns Promise resolving to array of removed phrases
 * @throws Error if request fails after all retries
 *
 * @example
 * ```typescript
 * const removed = await fetchTransparency('story-123');
 * console.log(`${removed.length} phrases were neutralized`);
 * ```
 */
export async function fetchTransparency(storyId: string): Promise<string[]> {
  const response = await fetchWithRetry(`${API_BASE_URL}/v1/stories/${storyId}/transparency`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: ApiTransparencyResponse = await response.json();
  return data.removed_phrases || [];
}
