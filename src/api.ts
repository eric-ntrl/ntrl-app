import { API_BASE_URL } from './config';
import type { Brief, Section, Item, Detail } from './types';
import { getCachedBrief, cacheBrief } from './storage/storageService';

// API Response Types
type ApiBriefStory = {
  id: string;
  neutral_headline: string;
  neutral_summary: string;
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
  neutral_headline: string;
  neutral_summary: string;
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
  neutral_headline: string;
  neutral_summary: string;
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
            headline: story.neutral_headline,
            summary: story.neutral_summary,
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

// Fetch brief from API
export async function fetchBrief(): Promise<Brief> {
  const response = await fetch(`${API_BASE_URL}/v1/brief`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  const data: ApiBriefResponse = await response.json();
  return transformBrief(data);
}

// Result type for cache-aware fetch
export type BriefFetchResult = {
  brief: Brief;
  fromCache: boolean;
};

const FETCH_TIMEOUT_MS = 10000; // 10 seconds

// Fetch brief with automatic caching and offline fallback
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

// Fetch story detail
export async function fetchStoryDetail(storyId: string): Promise<Detail> {
  const response = await fetch(`${API_BASE_URL}/v1/stories/${storyId}`);

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

// Fetch transparency (removed phrases)
export async function fetchTransparency(storyId: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/v1/stories/${storyId}/transparency`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: ApiTransparencyResponse = await response.json();
  return data.removed_phrases || [];
}
