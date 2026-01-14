/**
 * TEMPORARY: Dev article provider for UI testing.
 * Remove once backend is connected.
 *
 * DEV_ONLY: Fetches real RSS articles for testing the UI while
 * the backend is not connected. Falls back to local mock data
 * if RSS fetching fails.
 */

import type { Item } from '../types';
import { fetchRSS, type RSSItem } from './rssParser';
import { getFallbackArticles } from './fallbackArticles';
import { ENABLE_DEV_MODE } from '../config';

/**
 * RSS feed sources (no API key required)
 * Using feeds that typically work in React Native without CORS issues
 */
const RSS_SOURCES = [
  {
    name: 'BBC World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    sourceUrl: 'https://www.bbc.com/news',
  },
  {
    name: 'NPR News',
    url: 'https://feeds.npr.org/1001/rss.xml',
    sourceUrl: 'https://www.npr.org',
  },
  {
    name: 'Reuters World',
    url: 'https://www.reutersagency.com/feed/?best-topics=world&post_type=best',
    sourceUrl: 'https://www.reuters.com',
  },
];

/**
 * Time constants
 */
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * Generate a unique ID for an article
 */
function generateId(source: string, guid: string): string {
  const hash = guid.split('').reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  return `dev-${source.toLowerCase().replace(/\s+/g, '-')}-${Math.abs(hash).toString(36)}`;
}

/**
 * Extract key phrases from text that might be "sensational"
 * This is a simplified simulation of what the backend neutralizer does
 */
function extractPotentialRemovals(text: string): string[] {
  const sensationalPatterns = [
    /\b(breaking|urgent|shocking|stunning|explosive|bombshell)\b/gi,
    /\b(slams?|blasts?|destroys?|crushes?|annihilates?)\b/gi,
    /\b(crisis|chaos|disaster|catastrophe|nightmare)\b/gi,
    /\b(massive|huge|enormous|incredible|unbelievable)\b/gi,
    /\b(terrifying|horrifying|devastating|heartbreaking)\b/gi,
    /\b(outrage|fury|backlash|firestorm)\b/gi,
  ];

  const matches: string[] = [];
  for (const pattern of sensationalPatterns) {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found.map((m) => m.toLowerCase()));
    }
  }

  // Return unique matches
  return [...new Set(matches)];
}

/**
 * Create a pseudo-neutral headline from original
 * Removes common sensational words
 */
function neutralizeHeadline(original: string): string {
  return original
    .replace(/\b(breaking|urgent|exclusive|shocking):\s*/gi, '')
    .replace(/\b(slams?|blasts?|rips?|destroys?)\b/gi, 'responds to')
    .replace(/\b(stunning|shocking|explosive)\b/gi, 'notable')
    .replace(/\b(crisis|chaos|disaster)\b/gi, 'situation')
    .trim();
}

/**
 * Content length constants
 */
const FEED_SUMMARY_MAX_CHARS = 90; // ~1-2 lines on mobile
const DETAIL_MAX_SENTENCES = 10;
const DETAIL_MIN_CHARS = 120; // Ensure detail is materially longer than summary

/**
 * Create a pseudo-neutral summary from RSS description
 * Enforces 1-2 line brevity for Feed cards
 */
function createNeutralSummary(description: string): string {
  if (!description) {
    return '';
  }

  // Remove HTML tags and normalize whitespace
  const cleaned = description
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return '';
  }

  // Truncate to 1-2 lines (~90 chars) at word boundary
  if (cleaned.length <= FEED_SUMMARY_MAX_CHARS) {
    return cleaned;
  }

  // Find last space before limit to avoid cutting words
  const truncated = cleaned.substring(0, FEED_SUMMARY_MAX_CHARS);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 60) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Create placeholder detail structure
 * Generates content suitable for organic narrative rendering
 * Detail content must be materially longer than Feed summary
 */
function createPlaceholderDetail(
  headline: string,
  description: string,
  sourceName: string
): Item['detail'] {
  const removed = extractPotentialRemovals(headline + ' ' + description);

  // Clean and preserve more content for detail view (longer than summary)
  const cleanDescription = description
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Use full description for detail (up to ~400 chars for 2-3 short paragraphs)
  const detailText =
    cleanDescription.length > 400 ? cleanDescription.substring(0, 397) + '...' : cleanDescription;

  // Only use fallback if truly no content
  const hasSubstance = detailText.length >= DETAIL_MIN_CHARS;

  return {
    what_happened: detailText || `${sourceName} reports on this story.`,
    why_it_matters: '',
    known: [],
    uncertain: hasSubstance ? ['what further developments may follow'] : [],
    removed: removed.length > 0 ? removed : undefined,
  };
}

/**
 * Map RSS item to NTRL Item type
 */
function mapRSSToItem(rssItem: RSSItem, sourceName: string, sourceUrl: string): Item {
  const id = generateId(sourceName, rssItem.guid || rssItem.link);
  const originalHeadline = rssItem.title;
  const neutralHeadline = neutralizeHeadline(originalHeadline);

  return {
    id,
    source: sourceName,
    source_url: sourceUrl,
    published_at: rssItem.pubDate || new Date().toISOString(),
    headline: neutralHeadline,
    summary: createNeutralSummary(rssItem.description),
    url: rssItem.link,
    original_text: originalHeadline, // Store original headline as "original text" for redline demo
    detail: createPlaceholderDetail(originalHeadline, rssItem.description, sourceName),
  };
}

/**
 * Check if article is within recency window
 */
function isRecent(publishedAt: string, maxAgeMs: number = FORTY_EIGHT_HOURS_MS): boolean {
  try {
    const published = new Date(publishedAt).getTime();
    const now = Date.now();
    return now - published <= maxAgeMs;
  } catch {
    // If date parsing fails, assume it's recent
    return true;
  }
}

/**
 * Fetch articles from a single RSS source
 */
async function fetchFromSource(source: {
  name: string;
  url: string;
  sourceUrl: string;
}): Promise<Item[]> {
  try {
    const rssItems = await fetchRSS(source.url);
    return rssItems
      .map((item) => mapRSSToItem(item, source.name, source.sourceUrl))
      .filter((item) => isRecent(item.published_at));
  } catch (error) {
    console.warn(`[DevArticleProvider] Failed to fetch ${source.name}:`, error);
    return [];
  }
}

/**
 * Fetch dev articles from RSS feeds with fallback
 *
 * Attempts to fetch from public RSS feeds. If all fail,
 * returns fallback mock articles that always pass recency filter.
 */
export async function getDevArticles(): Promise<Item[]> {
  console.log('[DevArticleProvider] Fetching dev articles...');

  // Fetch from all sources in parallel
  const results = await Promise.all(RSS_SOURCES.map(fetchFromSource));

  // Flatten and deduplicate by URL
  const allArticles = results.flat();
  const seen = new Set<string>();
  const uniqueArticles = allArticles.filter((article) => {
    if (seen.has(article.url)) return false;
    seen.add(article.url);
    return true;
  });

  // Sort by published date (newest first)
  uniqueArticles.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  console.log(`[DevArticleProvider] Fetched ${uniqueArticles.length} articles from RSS`);

  // If we got articles, return them
  if (uniqueArticles.length > 0) {
    return uniqueArticles;
  }

  // Fall back to mock articles
  console.log('[DevArticleProvider] Using fallback articles');
  return getFallbackArticles();
}

/**
 * DEV_MODE flag - controlled by environment configuration.
 * Only true in development environment.
 */
export const DEV_MODE = ENABLE_DEV_MODE;
