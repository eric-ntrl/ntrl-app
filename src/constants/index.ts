/**
 * Centralized constants for the NTRL app.
 * Avoids magic numbers scattered throughout the codebase.
 */

/**
 * Animation durations in milliseconds
 */
export const ANIMATION = {
  /** Toast fade in duration */
  TOAST_FADE_IN: 200,
  /** Toast fade out duration */
  TOAST_FADE_OUT: 300,
  /** Toast display duration (hold time) */
  TOAST_HOLD: 1500,
  /** Press opacity feedback */
  PRESS_OPACITY: 0.6,
} as const;

/**
 * Network fetch configuration
 */
export const FETCH = {
  /** Default request timeout in milliseconds */
  TIMEOUT_MS: 10000,
  /** Reader mode fetch timeout (longer for article extraction) */
  READER_TIMEOUT_MS: 12000,
  /** Maximum retry attempts for failed requests */
  MAX_RETRIES: 3,
  /** Base delay for exponential backoff in milliseconds */
  RETRY_BASE_DELAY_MS: 1000,
} as const;

/**
 * Cache configuration
 */
export const CACHE = {
  /** Brief cache time-to-live (24 hours) */
  BRIEF_TTL_MS: 24 * 60 * 60 * 1000,
  /** Reader mode cache time-to-live (6 hours) */
  READER_TTL_MS: 6 * 60 * 60 * 1000,
} as const;

/**
 * Content processing thresholds
 */
export const CONTENT = {
  /** Minimum extracted text length for "good" extraction */
  MIN_EXTRACTED_LENGTH: 600,
  /** Minimum text length for summary generation */
  MIN_CHARS_FOR_SUMMARY: 900,
  /** Minimum input length for detail summary */
  MIN_INPUT_LENGTH: 300,
  /** Minimum output length for detail summary */
  MIN_OUTPUT_LENGTH: 200,
  /** Maximum sentences in article detail */
  DETAIL_MAX_SENTENCES: 10,
  /** Maximum paragraphs in article detail */
  DETAIL_MAX_PARAGRAPHS: 3,
  /** 24 hours in milliseconds (for feed filtering) */
  TWENTY_FOUR_HOURS_MS: 24 * 60 * 60 * 1000,
} as const;

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  PREFERENCES: 'ntrl_preferences',
  SAVED_ARTICLES: 'ntrl_saved_articles',
  HISTORY: 'ntrl_history',
  RECENT_SEARCHES: 'ntrl_recent_searches',
  BRIEF_CACHE: 'ntrl_brief_cache',
} as const;

/**
 * List limits
 */
export const LIMITS = {
  /** Maximum saved articles */
  MAX_SAVED_ARTICLES: 100,
  /** Maximum history entries */
  MAX_HISTORY: 50,
  /** Maximum recent searches */
  MAX_RECENT_SEARCHES: 10,
  /** Pagination page size */
  PAGE_SIZE: 20,
} as const;
