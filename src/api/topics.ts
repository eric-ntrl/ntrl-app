/**
 * Topics API Client
 *
 * Provides functions for fetching trending topics.
 *
 * @module api/topics
 */

import { API_BASE_URL } from '../config';
import type { TrendingTopicsResponse } from '../types/search';

// Request configuration
const FETCH_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Fetch trending topics from recent articles.
 *
 * Returns a list of trending terms/phrases extracted from article titles
 * and summaries within the specified time window. Results are cached
 * server-side for 5 minutes.
 *
 * @param windowHours - Time window in hours (1-168, default 24)
 * @returns Promise resolving to TrendingTopicsResponse
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const topics = await getTrendingTopics();
 * console.log(`${topics.topics.length} trending topics`);
 * ```
 */
export async function getTrendingTopics(
  windowHours: number = 24
): Promise<TrendingTopicsResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = `${API_BASE_URL}/v1/topics/trending?window_hours=${windowHours}`;
    const response = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }

    const data: TrendingTopicsResponse = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}
