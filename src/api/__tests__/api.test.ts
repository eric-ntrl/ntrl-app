/**
 * Tests for the NTRL API client.
 *
 * Covers: fetchBrief, fetchBriefWithCache, fetchStoryDetail, fetchTransparency,
 * retry logic, cache fallback, and response transforms.
 */

// ---------------------------------------------------------------------------
// Mocks — must be declared before imports
// ---------------------------------------------------------------------------

jest.mock('../../config', () => ({
  API_BASE_URL: 'https://api.test.ntrl.app',
}));

jest.mock('../../storage/storageService', () => ({
  getCachedBrief: jest.fn(),
  cacheBrief: jest.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { fetchBrief, fetchBriefWithCache, fetchStoryDetail, fetchTransparency } from '../../api';
import { getCachedBrief, cacheBrief } from '../../storage/storageService';
import type { Brief } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE = 'https://api.test.ntrl.app';

/** Minimal valid API brief response for testing transforms. */
function makeApiBriefResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'brief-1',
    brief_date: '2026-01-27',
    cutoff_time: '2026-01-27T00:00:00Z',
    assembled_at: '2026-01-27T08:00:00Z',
    sections: [
      {
        name: 'world',
        display_name: 'World',
        order: 1,
        stories: [
          {
            id: 'story-1',
            feed_title: 'Headline One',
            feed_summary: 'Summary one.',
            source_name: 'Reuters',
            source_url: 'https://reuters.com/article-1',
            published_at: '2026-01-27T06:00:00Z',
            has_manipulative_content: false,
            position: 1,
            detail_title: 'Detail Title One',
            detail_brief: 'Detail brief one.',
            detail_full: 'Full article text.',
            disclosure: null,
          },
        ],
      },
    ],
    ...overrides,
  };
}

/** Minimal API story detail response. */
function makeApiStoryDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: 'story-1',
    feed_title: 'Feed Title',
    feed_summary: 'Feed Summary.',
    detail_title: 'Detail Title',
    detail_brief: 'Detail Brief.',
    detail_full: 'Detail Full.',
    disclosure: 'Some disclosure.',
    has_manipulative_content: true,
    source_name: 'AP',
    source_url: 'https://ap.com/story-1',
    published_at: '2026-01-27T06:00:00Z',
    section: 'world',
    ...overrides,
  };
}

/** Minimal API transparency response. */
function makeApiTransparencyResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'story-1',
    original_title: 'Original Title',
    original_description: 'Original desc.',
    original_body: 'The original body text with manipulative language.',
    original_body_available: true,
    original_body_expired: false,
    feed_title: 'Feed Title',
    feed_summary: 'Feed Summary.',
    detail_full: 'Detail Full.',
    spans: [
      {
        start_char: 30,
        end_char: 55,
        original_text: 'manipulative language',
        action: 'neutralized',
        reason: 'emotional_trigger',
        replacement_text: 'strong language',
      },
    ],
    disclosure: 'Disclosure text.',
    has_manipulative_content: true,
    source_url: 'https://example.com/article',
    ...overrides,
  };
}

/** Helper to create a mock Response. */
function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
    headers: new Headers(),
    redirected: false,
    statusText: status === 200 ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    bytes: jest.fn(),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Global fetch mock setup
// ---------------------------------------------------------------------------

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
  jest.useFakeTimers({ advanceTimers: true });
  (getCachedBrief as jest.Mock).mockResolvedValue(null);
  (cacheBrief as jest.Mock).mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  global.fetch = originalFetch;
});

// ===========================================================================
// fetchBrief
// ===========================================================================

describe('fetchBrief', () => {
  it('fetches and transforms a brief response', async () => {
    const apiData = makeApiBriefResponse();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(apiData));

    const brief = await fetchBrief();

    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/v1/brief?hours=24`);
    expect(brief.generated_at).toBe('2026-01-27T08:00:00Z');
    expect(brief.sections).toHaveLength(1);
    expect(brief.sections[0].key).toBe('world');
    expect(brief.sections[0].title).toBe('World');
    expect(brief.sections[0].items).toHaveLength(1);

    const item = brief.sections[0].items[0];
    expect(item.id).toBe('story-1');
    expect(item.headline).toBe('Headline One');
    expect(item.summary).toBe('Summary one.');
    expect(item.source).toBe('Reuters');
    expect(item.detail.title).toBe('Detail Title One');
    expect(item.detail.brief).toBe('Detail brief one.');
    expect(item.detail.full).toBe('Full article text.');
  });

  it('throws on non-OK response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse('Server Error', 500));

    await expect(fetchBrief()).rejects.toThrow('Server Error');
  });

  it('throws with HTTP status when response text is empty', async () => {
    const resp = mockResponse('', 503);
    (resp.text as jest.Mock).mockResolvedValue('');
    (global.fetch as jest.Mock).mockResolvedValue(resp);

    await expect(fetchBrief()).rejects.toThrow('HTTP 503');
  });

  it('filters out stories with empty feed_title', async () => {
    const apiData = makeApiBriefResponse({
      sections: [
        {
          name: 'world',
          display_name: 'World',
          order: 1,
          stories: [
            {
              id: 'story-ok',
              feed_title: 'Valid Title',
              feed_summary: 'Summary.',
              source_name: 'AP',
              source_url: 'https://ap.com',
              published_at: '2026-01-27T06:00:00Z',
              has_manipulative_content: false,
              position: 1,
              detail_title: null,
              detail_brief: null,
              detail_full: null,
              disclosure: null,
            },
            {
              id: 'story-empty',
              feed_title: '',
              feed_summary: 'Summary.',
              source_name: 'AP',
              source_url: 'https://ap.com',
              published_at: '2026-01-27T06:00:00Z',
              has_manipulative_content: false,
              position: 2,
              detail_title: null,
              detail_brief: null,
              detail_full: null,
              disclosure: null,
            },
            {
              id: 'story-whitespace',
              feed_title: '   ',
              feed_summary: 'Summary.',
              source_name: 'AP',
              source_url: 'https://ap.com',
              published_at: '2026-01-27T06:00:00Z',
              has_manipulative_content: false,
              position: 3,
              detail_title: null,
              detail_brief: null,
              detail_full: null,
              disclosure: null,
            },
          ],
        },
      ],
    });
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(apiData));

    const brief = await fetchBrief();
    expect(brief.sections[0].items).toHaveLength(1);
    expect(brief.sections[0].items[0].id).toBe('story-ok');
  });

  it('filters out sections that become empty after story filtering', async () => {
    const apiData = makeApiBriefResponse({
      sections: [
        {
          name: 'empty-section',
          display_name: 'Empty',
          order: 1,
          stories: [
            {
              id: 'bad',
              feed_title: '',
              feed_summary: '',
              source_name: 'AP',
              source_url: 'https://ap.com',
              published_at: '2026-01-27T06:00:00Z',
              has_manipulative_content: false,
              position: 1,
              detail_title: null,
              detail_brief: null,
              detail_full: null,
              disclosure: null,
            },
          ],
        },
        {
          name: 'world',
          display_name: 'World',
          order: 2,
          stories: [
            {
              id: 'good',
              feed_title: 'Good Title',
              feed_summary: 'Good summary.',
              source_name: 'Reuters',
              source_url: 'https://reuters.com',
              published_at: '2026-01-27T06:00:00Z',
              has_manipulative_content: false,
              position: 1,
              detail_title: null,
              detail_brief: null,
              detail_full: null,
              disclosure: null,
            },
          ],
        },
      ],
    });
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(apiData));

    const brief = await fetchBrief();
    expect(brief.sections).toHaveLength(1);
    expect(brief.sections[0].key).toBe('world');
  });

  it('falls back to feed_title and feed_summary for detail fields when null', async () => {
    const apiData = makeApiBriefResponse({
      sections: [
        {
          name: 'world',
          display_name: 'World',
          order: 1,
          stories: [
            {
              id: 'story-fallback',
              feed_title: 'Feed Title',
              feed_summary: 'Feed Summary.',
              source_name: 'AP',
              source_url: 'https://ap.com',
              published_at: '2026-01-27T06:00:00Z',
              has_manipulative_content: false,
              position: 1,
              detail_title: null,
              detail_brief: null,
              detail_full: null,
              disclosure: null,
            },
          ],
        },
      ],
    });
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(apiData));

    const brief = await fetchBrief();
    const item = brief.sections[0].items[0];
    expect(item.detail.title).toBe('Feed Title');
    expect(item.detail.brief).toBe('Feed Summary.');
    expect(item.detail.full).toBeNull();
  });
});

// ===========================================================================
// fetchBriefWithCache
// ===========================================================================

describe('fetchBriefWithCache', () => {
  it('returns fresh data and caches it on success', async () => {
    const apiData = makeApiBriefResponse();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(apiData));

    const result = await fetchBriefWithCache();

    expect(result.fromCache).toBe(false);
    expect(result.brief.sections).toHaveLength(1);
    expect(cacheBrief).toHaveBeenCalledWith(result.brief);
  });

  it('returns empty brief (not cache) on 404', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse('Not Found', 404));
    (getCachedBrief as jest.Mock).mockResolvedValue({
      brief: { generated_at: 'old', sections: [] },
      cachedAt: '2026-01-26T00:00:00Z',
      briefDate: '2026-01-26T00:00:00Z',
    });

    const result = await fetchBriefWithCache();

    expect(result.fromCache).toBe(false);
    expect(result.brief.sections).toHaveLength(0);
  });

  it('falls back to cached brief on network failure', async () => {
    const cachedBrief: Brief = {
      generated_at: '2026-01-26T08:00:00Z',
      sections: [
        {
          key: 'us',
          title: 'U.S.',
          items: [
            {
              id: 'cached-story',
              source: 'AP',
              published_at: '2026-01-26T06:00:00Z',
              headline: 'Cached Headline',
              summary: 'Cached summary.',
              url: 'https://ap.com/cached',
              has_manipulative_content: false,
              detail: { title: 'T', brief: 'B', full: null, disclosure: null },
            },
          ],
        },
      ],
    };
    (getCachedBrief as jest.Mock).mockResolvedValue({
      brief: cachedBrief,
      cachedAt: '2026-01-26T08:00:00Z',
      briefDate: '2026-01-26T08:00:00Z',
    });
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const result = await fetchBriefWithCache();

    expect(result.fromCache).toBe(true);
    expect(result.brief.sections[0].items[0].id).toBe('cached-story');
  });

  it('throws when network fails and no cache is available', async () => {
    (getCachedBrief as jest.Mock).mockResolvedValue(null);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(fetchBriefWithCache()).rejects.toThrow('Network error');
  });

  it('falls back to cache on non-OK response (server error)', async () => {
    const cachedBrief: Brief = {
      generated_at: '2026-01-26T08:00:00Z',
      sections: [],
    };
    (getCachedBrief as jest.Mock).mockResolvedValue({
      brief: cachedBrief,
      cachedAt: '2026-01-26T08:00:00Z',
      briefDate: '2026-01-26T08:00:00Z',
    });
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse('Internal Server Error', 500));

    const result = await fetchBriefWithCache();

    expect(result.fromCache).toBe(true);
    expect(result.brief).toBe(cachedBrief);
  });
});

// ===========================================================================
// fetchStoryDetail
// ===========================================================================

describe('fetchStoryDetail', () => {
  it('fetches and transforms story detail', async () => {
    const apiData = makeApiStoryDetail();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(apiData));

    const detail = await fetchStoryDetail('story-1');

    expect(detail.title).toBe('Detail Title');
    expect(detail.brief).toBe('Detail Brief.');
    expect(detail.full).toBe('Detail Full.');
    expect(detail.disclosure).toBe('Some disclosure.');
  });

  it('falls back to feed fields when detail fields are null', async () => {
    const apiData = makeApiStoryDetail({
      detail_title: null,
      detail_brief: null,
      detail_full: null,
      disclosure: null,
    });
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(apiData));

    const detail = await fetchStoryDetail('story-1');

    expect(detail.title).toBe('Feed Title');
    expect(detail.brief).toBe('Feed Summary.');
    expect(detail.full).toBeNull();
    expect(detail.disclosure).toBeNull();
  });

  it('throws on non-OK response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse('', 404));

    await expect(fetchStoryDetail('missing')).rejects.toThrow('HTTP 404');
  });

  it('retries on server error then succeeds', async () => {
    const apiData = makeApiStoryDetail();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockResponse('', 500))
      .mockResolvedValueOnce(mockResponse(apiData));

    const detail = await fetchStoryDetail('story-1');

    expect(detail.title).toBe('Detail Title');
    // First call fails (500), retry delay, second call succeeds
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries on network error then succeeds', async () => {
    const apiData = makeApiStoryDetail();
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce(mockResponse(apiData));

    const detail = await fetchStoryDetail('story-1');

    expect(detail.title).toBe('Detail Title');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 4xx client errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse('', 400));

    await expect(fetchStoryDetail('bad-id')).rejects.toThrow('HTTP 400');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// fetchTransparency
// ===========================================================================

describe('fetchTransparency', () => {
  it('fetches and transforms transparency data', async () => {
    const apiData = makeApiTransparencyResponse();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(apiData));

    const result = await fetchTransparency('story-1');

    expect(result.originalBody).toBe('The original body text with manipulative language.');
    expect(result.originalBodyAvailable).toBe(true);
    expect(result.originalBodyExpired).toBe(false);
    expect(result.sourceUrl).toBe('https://example.com/article');
    expect(result.spans).toHaveLength(1);
    expect(result.spans[0]).toEqual({
      start_char: 30,
      end_char: 55,
      original_text: 'manipulative language',
      action: 'neutralized',
      reason: 'emotional_trigger',
      replacement_text: 'strong language',
    });
  });

  it('returns empty spans array when spans is missing', async () => {
    const apiData = makeApiTransparencyResponse({ spans: undefined });
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(apiData));

    const result = await fetchTransparency('story-1');
    expect(result.spans).toEqual([]);
  });

  it('handles null original_body', async () => {
    const apiData = makeApiTransparencyResponse({
      original_body: null,
      original_body_available: false,
    });
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(apiData));

    const result = await fetchTransparency('story-1');
    expect(result.originalBody).toBeNull();
    expect(result.originalBodyAvailable).toBe(false);
  });

  it('handles expired original body', async () => {
    const apiData = makeApiTransparencyResponse({
      original_body: null,
      original_body_available: false,
      original_body_expired: true,
    });
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(apiData));

    const result = await fetchTransparency('story-1');
    expect(result.originalBody).toBeNull();
    expect(result.originalBodyExpired).toBe(true);
  });

  it('throws on non-OK response after retries', async () => {
    // fetchWithRetry retries 500s with exponential backoff. All attempts return 500.
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse('', 500));

    // Start the fetch (it will wait on setTimeout for backoff)
    const promise = fetchTransparency('story-1');

    // Advance fake timers enough to exhaust all retries (1s + 2s + 4s = 7s)
    for (let i = 0; i < 10; i++) {
      await Promise.resolve(); // flush microtasks
      jest.advanceTimersByTime(2000);
    }

    await expect(promise).rejects.toThrow('HTTP 500');
  }, 15000);

  it('uses the correct URL with story ID', async () => {
    const apiData = makeApiTransparencyResponse();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(apiData));

    await fetchTransparency('abc-123');

    // fetchWithRetry adds AbortController signal, check the URL
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/v1/stories/abc-123/transparency`,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });
});
