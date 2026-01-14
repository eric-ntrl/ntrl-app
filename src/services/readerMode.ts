/**
 * Reader Mode Service
 * Fetches and extracts readable article text from URLs
 * with in-memory caching (TTL: 6 hours)
 */

import { validateUrl, isAllowedNewsDomain } from '../utils/urlValidator';

export type ArticleQuality = {
  charCount: number;
  sentenceCount: number;
  okForSummary: boolean;
};

export type ReadableArticle = {
  text: string;
  title?: string;
  excerpt?: string;
  quality: ArticleQuality;
};

type CacheEntry = {
  timestamp: number;
  data: ReadableArticle;
};

// In-memory cache (persists for app session)
const cache = new Map<string, CacheEntry>();

// Cache TTL: 6 hours in milliseconds
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// Minimum text length to consider extraction successful
const MIN_EXTRACTED_LENGTH = 600;

// Quality thresholds for okForSummary
const MIN_CHARS_FOR_SUMMARY = 900;
const MIN_SENTENCES_FOR_SUMMARY = 8;
const MAX_CTA_DENSITY_FOR_SUMMARY = 0.02; // 2% of words

// Fetch timeout
const FETCH_TIMEOUT_MS = 12000;

/**
 * CTA / boilerplate tokens to filter and penalize
 */
const BOILERPLATE_TOKENS = [
  'share',
  'save',
  'subscribe',
  'watch',
  'listen',
  'sign up',
  'newsletter',
  'sponsored',
  'advertisement',
  'related',
  'continue reading',
  'read more',
  'see also',
  'follow us',
  'join now',
  'get started',
  'download',
  'install',
  'comments',
  'reply',
  'like',
  'tweet',
  'post',
  'privacy policy',
  'terms of service',
  'cookie',
  'skip to content',
  'skip to main',
  'menu',
  'navigation',
  'log in',
  'sign in',
  'register',
  'create account',
];

/**
 * Get cached article if valid
 */
function getCached(url: string): ReadableArticle | null {
  const entry = cache.get(url);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    cache.delete(url);
    return null;
  }

  return entry.data;
}

/**
 * Store article in cache
 */
function setCache(url: string, data: ReadableArticle): void {
  cache.set(url, {
    timestamp: Date.now(),
    data,
  });
}

/**
 * Fetch with timeout and basic URL validation.
 * Validates URL structure but allows any HTTPS domain for article fetching.
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<string> {
  // Basic URL validation (structure and protocol only, skip domain whitelist)
  const validation = validateUrl(url, { allowLocalhost: false, skipDomainCheck: true });
  if (!validation.valid) {
    console.warn('[ReaderMode] Invalid URL structure:', url, validation.reason);
    throw new Error(`Invalid URL: ${validation.reason}`);
  }

  // Log if domain is not in our known list (for monitoring only)
  if (!isAllowedNewsDomain(url)) {
    console.log('[ReaderMode] Fetching from non-whitelisted domain:', url);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NTRL/1.0; +https://ntrl.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Decode HTML numeric entities (decimal &#39; and hex &#x27;)
 */
function decodeNumericEntities(text: string): string {
  // Decode decimal entities: &#39; &#8217; etc.
  let result = text.replace(/&#(\d+);/g, (_, code) => {
    const num = parseInt(code, 10);
    return num > 0 && num < 0x10ffff ? String.fromCodePoint(num) : '';
  });

  // Decode hex entities: &#x27; &#x2019; etc.
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
    const num = parseInt(code, 16);
    return num > 0 && num < 0x10ffff ? String.fromCodePoint(num) : '';
  });

  return result;
}

/**
 * Remove HTML tags, decode entities, normalize whitespace
 */
function stripHtml(html: string): string {
  let text = html
    // Remove script, style, noscript blocks entirely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    // Remove all HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common named entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"')
    .replace(/&lsquo;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '…');

  // Decode numeric entities (decimal and hex)
  text = decodeNumericEntities(text);

  // Normalize whitespace
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Remove boilerplate/CTA lines from text
 * Runs after HTML stripping, before scoring
 */
function removeBoilerplate(text: string): string {
  const lines = text.split(/\n+/);

  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    // Skip very short lines (likely nav items)
    if (trimmed.length < 20) {
      // Check if it's mostly boilerplate
      for (const token of BOILERPLATE_TOKENS) {
        if (lower === token || lower.startsWith(token + ' ') || lower.endsWith(' ' + token)) {
          return false;
        }
      }
    }

    // Skip lines that are primarily CTA content
    const words = lower.split(/\s+/);
    if (words.length <= 5) {
      const boilerplateCount = words.filter((w) =>
        BOILERPLATE_TOKENS.some((t) => t.includes(w) || w.includes(t))
      ).length;
      if (boilerplateCount >= words.length * 0.5) {
        return false;
      }
    }

    return true;
  });

  return filteredLines.join('\n');
}

/**
 * Count CTA tokens in text
 */
function countCtaTokens(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const token of BOILERPLATE_TOKENS) {
    const regex = new RegExp(`\\b${token.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

/**
 * Count sentences in text
 */
function countSentences(text: string): number {
  return (text.match(/[.!?]+(?:\s|$)/g) || []).length;
}

/**
 * Detect repeated short phrases (spam indicator)
 */
function hasRepeatedPhrases(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  if (words.length < 10) return false;

  // Check for repeated 2-3 word sequences
  const sequences = new Map<string, number>();
  for (let i = 0; i < words.length - 2; i++) {
    const seq = words.slice(i, i + 3).join(' ');
    sequences.set(seq, (sequences.get(seq) || 0) + 1);
  }

  // Flag if any sequence repeats more than 3 times
  for (const count of sequences.values()) {
    if (count > 3) return true;
  }
  return false;
}

/**
 * Score a text block by quality indicators
 * Higher score = more likely to be article content
 */
function scoreTextBlock(text: string): number {
  let score = 0;
  const length = text.length;
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = countSentences(text);
  const ctaCount = countCtaTokens(text);

  // Length bonus (prefer longer content, cap at 25)
  score += Math.min(length / 100, 25);

  // Sentence count bonus (cap at 25)
  score += Math.min(sentenceCount * 2.5, 25);

  // Paragraph-like structure bonus
  if (sentenceCount >= 3) score += 10;
  if (sentenceCount >= 8) score += 10;

  // Penalize if too short
  if (length < 200) score -= 25;
  if (length < 100) score -= 25;

  // Penalize low sentence density (words per sentence too high = run-on or junk)
  const sentenceDensity = wordCount / Math.max(sentenceCount, 1);
  if (sentenceDensity > 50) score -= 15; // Very low sentence density
  if (sentenceDensity > 100) score -= 20;

  // Penalize high CTA density
  const ctaDensity = ctaCount / Math.max(wordCount, 1);
  if (ctaDensity > 0.05) score -= 20; // >5% CTA words
  if (ctaDensity > 0.1) score -= 30; // >10% CTA words

  // Penalize repeated phrases (spam indicator)
  if (hasRepeatedPhrases(text)) score -= 25;

  // Penalize navigation-like content
  const navWords = [
    'menu',
    'navigation',
    'subscribe',
    'sign up',
    'log in',
    'cookie',
    'footer',
    'header',
    'sidebar',
  ];
  for (const word of navWords) {
    if (text.toLowerCase().includes(word)) score -= 3;
  }

  return score;
}

/**
 * Extract main article text from HTML
 * Uses multiple strategies and picks the best result
 */
function extractMainText(html: string): string {
  const candidates: Array<{ text: string; score: number; source: string }> = [];

  // Strategy 1: Look for <article> tag (highest priority)
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    let text = stripHtml(articleMatch[1]);
    text = removeBoilerplate(text);
    if (text.length > 100) {
      candidates.push({ text, score: scoreTextBlock(text) + 20, source: 'article' });
    }
  }

  // Strategy 2: Look for <main> tag
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    let text = stripHtml(mainMatch[1]);
    text = removeBoilerplate(text);
    if (text.length > 100) {
      candidates.push({ text, score: scoreTextBlock(text) + 15, source: 'main' });
    }
  }

  // Strategy 3: Look for common article body classes (good priority)
  const bodyPatterns = [
    { pattern: /<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i, bonus: 12 },
    { pattern: /<div[^>]*class="[^"]*story-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i, bonus: 12 },
    { pattern: /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i, bonus: 10 },
    { pattern: /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i, bonus: 10 },
    { pattern: /<div[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i, bonus: 12 },
    { pattern: /<div[^>]*class="[^"]*story-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i, bonus: 12 },
    { pattern: /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i, bonus: 5 },
  ];

  for (const { pattern, bonus } of bodyPatterns) {
    const match = html.match(pattern);
    if (match) {
      let text = stripHtml(match[1]);
      text = removeBoilerplate(text);
      if (text.length > 200) {
        candidates.push({ text, score: scoreTextBlock(text) + bonus, source: 'class' });
      }
    }
  }

  // Strategy 4: Extract all <p> tags and combine (fallback)
  const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  if (paragraphs.length > 0) {
    let combinedText = paragraphs
      .map((p) => stripHtml(p))
      .filter((p) => p.length > 50) // Filter out short navigation-like paragraphs
      .join('\n\n');
    combinedText = removeBoilerplate(combinedText);
    if (combinedText.length > 300) {
      candidates.push({
        text: combinedText,
        score: scoreTextBlock(combinedText),
        source: 'paragraphs',
      });
    }
  }

  // Pick the best candidate
  if (candidates.length === 0) {
    return '';
  }

  candidates.sort((a, b) => b.score - a.score);
  console.log('[ReaderMode] Best candidate:', candidates[0].source, 'score:', candidates[0].score);
  return candidates[0].text;
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string | undefined {
  // Try og:title first
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
  if (ogTitle) return stripHtml(ogTitle[1]);

  // Try <title> tag
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (title) return stripHtml(title[1]);

  // Try <h1>
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1) return stripHtml(h1[1]);

  return undefined;
}

/**
 * Calculate quality metrics for extracted text
 */
function calculateQuality(text: string): ArticleQuality {
  const charCount = text.length;
  const sentenceCount = countSentences(text);
  const wordCount = text.split(/\s+/).length;
  const ctaCount = countCtaTokens(text);
  const ctaDensity = ctaCount / Math.max(wordCount, 1);

  const okForSummary =
    charCount >= MIN_CHARS_FOR_SUMMARY &&
    sentenceCount >= MIN_SENTENCES_FOR_SUMMARY &&
    ctaDensity <= MAX_CTA_DENSITY_FOR_SUMMARY;

  return {
    charCount,
    sentenceCount,
    okForSummary,
  };
}

/**
 * Get readable article from URL
 * Returns extracted text with quality metrics, with caching and fallback handling
 */
export async function getReadableArticle(
  url: string,
  fallbackText?: string
): Promise<ReadableArticle | null> {
  // Check cache first
  const cached = getCached(url);
  if (cached) {
    console.log('[ReaderMode] Cache hit:', url);
    return cached;
  }

  try {
    console.log('[ReaderMode] Fetching:', url);
    const html = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);

    const text = extractMainText(html);
    const title = extractTitle(html);
    const quality = calculateQuality(text);

    // Check if extraction was successful
    if (text.length >= MIN_EXTRACTED_LENGTH) {
      const result: ReadableArticle = { text, title, quality };
      setCache(url, result);
      console.log(
        '[ReaderMode] Extracted:',
        quality.charCount,
        'chars,',
        quality.sentenceCount,
        'sentences, okForSummary:',
        quality.okForSummary
      );
      return result;
    }

    // Extraction yielded too little text
    console.log('[ReaderMode] Extraction too short:', text.length, 'chars');

    // Use fallback if provided and substantial
    if (fallbackText && fallbackText.length >= 100) {
      const fallbackQuality = calculateQuality(fallbackText);
      const fallbackResult: ReadableArticle = {
        text: fallbackText,
        title,
        quality: fallbackQuality,
      };
      setCache(url, fallbackResult);
      return fallbackResult;
    }

    return null;
  } catch (error) {
    console.warn('[ReaderMode] Fetch failed:', error);

    // Use fallback on error
    if (fallbackText && fallbackText.length >= 100) {
      const fallbackQuality = calculateQuality(fallbackText);
      const fallbackResult: ReadableArticle = { text: fallbackText, quality: fallbackQuality };
      setCache(url, fallbackResult);
      return fallbackResult;
    }

    return null;
  }
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}
