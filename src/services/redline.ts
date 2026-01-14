/**
 * Redline Detection Service
 *
 * @deprecated PLACEHOLDER/DEV-ONLY
 *
 * This service is a demo placeholder for manipulative language detection.
 * Production implementation should use backend API:
 *   - GET /v1/stories/{id}/transparency (returns spans)
 *   - GET /v1/stories/{id}/redlines (when available)
 *
 * Client-side detection exists for:
 *   1. Offline fallback
 *   2. Dev/demo when backend unavailable
 *
 * Detection rules should match backend neutralizer.py patterns.
 *
 * **Current behavior:** Analyzes text to identify and locate manipulative,
 * sensational, clickbait, and call-to-action language. Used by NTRL to
 * highlight problematic language in the Transparency view, helping users
 * understand how news language can be designed to manipulate emotions
 * and drive engagement.
 *
 * Detection categories:
 * - **Manipulative language**: Urgency terms, sensationalism, conflict amplification
 * - **Promotional content**: CTAs, newsletter prompts, engagement bait
 * - **Emphatic capitalization**: ALL CAPS words (excluding common acronyms)
 * - **Excessive punctuation**: Multiple exclamation/question marks
 *
 * TODO: Remove/reduce after backend migration complete
 * @see FEATURE_FLAGS.USE_BACKEND_REDLINES in src/config/index.ts
 *
 * @module services/redline
 */

/**
 * Represents a detected problematic phrase in text.
 * Contains position information for highlighting and the reason for flagging.
 */
export type RedlineSpan = {
  /** Starting character index in the original text */
  start: number;
  /** Ending character index (exclusive) in the original text */
  end: number;
  /** The actual matched text (preserves original casing) */
  text: string;
  /** Category of the issue (e.g., 'manipulative language', 'promotional content') */
  reason: string;
};

/**
 * CTA / promotional / junk phrases (case-insensitive)
 * These indicate boilerplate content that shouldn't appear in neutral news
 */
const CTA_PHRASES = [
  // Social/sharing CTAs
  'share this',
  'save this',
  'subscribe now',
  'subscribe today',
  'sign up now',
  'sign up today',
  'sign up for',
  'watch now',
  'watch live',
  'listen now',
  'download now',
  'click here',
  'tap here',
  'learn more',
  'read more',
  'see more',
  'find out more',

  // Promotional
  'sponsored content',
  'sponsored by',
  'advertisement',
  'paid partnership',
  'affiliate link',
  'related stories',
  'related articles',
  'recommended for you',
  'you may also like',
  'trending now',

  // Newsletter/account CTAs
  'join our newsletter',
  'get our newsletter',
  'create an account',
  'already a subscriber',
  'subscriber exclusive',
  'members only',

  // Engagement bait
  'what do you think',
  'let us know',
  'tell us in the comments',
  'comment below',
  'follow us on',
];

/**
 * Manipulative/sensational phrases (case-insensitive)
 */
const MANIPULATIVE_PHRASES = [
  // Urgency/alarm
  'breaking',
  'urgent',
  'must see',
  'must read',
  'you need to know',
  "you won't believe",
  'what you need to know',
  'this changes everything',

  // Sensationalism
  'shocking',
  'stunning',
  'explosive',
  'bombshell',
  'devastating',
  'horrifying',
  'terrifying',
  'nightmare',
  'chaos',
  'crisis',
  'catastrophe',
  'disaster',

  // Conflict amplification
  'slams',
  'blasts',
  'destroys',
  'annihilates',
  'crushes',
  'eviscerates',
  'rips',
  'tears into',
  'lashes out',
  'fires back',

  // Emotional manipulation
  'outrage',
  'fury',
  'backlash',
  'firestorm',
  'uproar',
  'heartbreaking',
  'gut-wrenching',

  // Clickbait patterns
  "you won't believe",
  'the reason why',
  'what happens next',
  'the truth about',
  'the real reason',
  'secret',
  'exposed',
  'revealed',

  // Absolutism
  'unprecedented',
  'historic',
  'landmark',
  'major victory',
  'major defeat',
  'game-changer',
  'breakthrough',
  'ground-breaking',
  'groundbreaking',

  // Fear/danger framing
  'dangerously',
  'deadly',
  'dangerous',
  'threat',
  'threatens',
  'warning',
  'alarming',
  'disturbing',

  // Superlatives (when used manipulatively)
  'massive',
  'huge',
  'enormous',
  'incredible',
  'unbelievable',
  'insane',
  'crazy',
];

/**
 * Find all matches of a phrase in text (case-insensitive)
 */
function findPhraseMatches(
  text: string,
  phrase: string
): Array<{ start: number; end: number; text: string }> {
  const matches: Array<{ start: number; end: number; text: string }> = [];
  const lowerText = text.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();

  let pos = 0;
  while (pos < lowerText.length) {
    const index = lowerText.indexOf(lowerPhrase, pos);
    if (index === -1) break;

    // Check word boundaries to avoid partial matches
    const before = index === 0 || /\W/.test(text[index - 1]);
    const after = index + phrase.length >= text.length || /\W/.test(text[index + phrase.length]);

    if (before && after) {
      matches.push({
        start: index,
        end: index + phrase.length,
        text: text.substring(index, index + phrase.length),
      });
    }

    pos = index + 1;
  }

  return matches;
}

/**
 * Find ALL CAPS words (4+ characters) that aren't acronyms
 */
function findAllCapsWords(text: string): Array<{ start: number; end: number; text: string }> {
  const matches: Array<{ start: number; end: number; text: string }> = [];
  const pattern = /\b[A-Z]{4,}\b/g;

  // Common acronyms to ignore
  const acronyms = new Set([
    'NASA',
    'NATO',
    'AIDS',
    'COVID',
    'ASAP',
    'RSVP',
    'HTML',
    'HTTP',
    'HTTPS',
    'USA',
    'UK',
    'EU',
    'UN',
    'FBI',
    'CIA',
    'NSA',
    'POTUS',
    'GDP',
    'CEO',
    'CFO',
    'COO',
    'NASA',
    'NOAA',
    'NCAA',
    'NFL',
    'NBA',
    'MLB',
    'NHL',
  ]);

  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (!acronyms.has(match[0])) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
    }
  }

  return matches;
}

/**
 * Find excessive punctuation (!!, ?!, etc.)
 */
function findExcessivePunctuation(
  text: string
): Array<{ start: number; end: number; text: string }> {
  const matches: Array<{ start: number; end: number; text: string }> = [];
  const pattern = /[!?]{2,}/g;

  let match;
  while ((match = pattern.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
    });
  }

  return matches;
}

/**
 * Merge overlapping spans
 */
function mergeOverlappingSpans(spans: RedlineSpan[]): RedlineSpan[] {
  if (spans.length === 0) return [];

  // Sort by start position
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const merged: RedlineSpan[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      // Overlapping - merge
      last.end = Math.max(last.end, current.end);
      last.text = last.text.length > current.text.length ? last.text : current.text;
      last.reason = last.reason.includes(current.reason)
        ? last.reason
        : `${last.reason}, ${current.reason}`;
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Find all manipulative language spans in text.
 *
 * Scans the input text for problematic patterns including:
 * - Manipulative phrases (urgency, sensationalism, conflict amplification)
 * - Promotional/CTA phrases (subscribe prompts, engagement bait)
 * - ALL CAPS words (4+ characters, excluding common acronyms like NASA, FBI)
 * - Excessive punctuation (!!, ?!, ???)
 *
 * Returns spans with exact positions for use in highlighting. Overlapping
 * matches are automatically merged, with the longer phrase preserved.
 *
 * @param text - The text content to analyze
 * @returns Array of RedlineSpan objects, sorted by position, with no overlaps
 *
 * @example
 * ```typescript
 * const spans = findRedlines('Breaking news!! Click here to subscribe now');
 * // Returns: [
 * //   { start: 0, end: 8, text: 'Breaking', reason: 'manipulative language' },
 * //   { start: 13, end: 15, text: '!!', reason: 'excessive punctuation' },
 * //   { start: 16, end: 26, text: 'Click here', reason: 'promotional content' },
 * //   { start: 30, end: 43, text: 'subscribe now', reason: 'promotional content' }
 * // ]
 * ```
 *
 * @example
 * ```typescript
 * // Use spans to highlight text in UI
 * const spans = findRedlines(articleText);
 * spans.forEach(span => {
 *   console.log(`Found "${span.text}" at ${span.start}-${span.end}: ${span.reason}`);
 * });
 * ```
 */
export function findRedlines(text: string): RedlineSpan[] {
  if (!text || text.length === 0) {
    return [];
  }

  const spans: RedlineSpan[] = [];

  // Check for manipulative phrases
  for (const phrase of MANIPULATIVE_PHRASES) {
    const matches = findPhraseMatches(text, phrase);
    for (const match of matches) {
      spans.push({
        ...match,
        reason: 'manipulative language',
      });
    }
  }

  // Check for CTA/promotional phrases
  for (const phrase of CTA_PHRASES) {
    const matches = findPhraseMatches(text, phrase);
    for (const match of matches) {
      spans.push({
        ...match,
        reason: 'promotional content',
      });
    }
  }

  // Check for ALL CAPS words
  const capsMatches = findAllCapsWords(text);
  for (const match of capsMatches) {
    spans.push({
      ...match,
      reason: 'emphatic capitalization',
    });
  }

  // Check for excessive punctuation
  const punctMatches = findExcessivePunctuation(text);
  for (const match of punctMatches) {
    spans.push({
      ...match,
      reason: 'excessive punctuation',
    });
  }

  // Merge overlapping spans
  return mergeOverlappingSpans(spans);
}

/**
 * Get a deduplicated list of detected manipulative phrases.
 *
 * Convenience function that extracts just the phrase text from redline detection,
 * useful for displaying a summary of problematic language found in an article.
 * All phrases are lowercased and deduplicated.
 *
 * @param text - The text content to analyze
 * @returns Array of unique lowercase phrases that were flagged
 *
 * @example
 * ```typescript
 * const phrases = getRedlinedPhrases('Breaking news! Breaking update!');
 * // Returns: ['breaking']  // Deduplicated, lowercased
 *
 * // Display in UI
 * phrases.forEach(phrase => {
 *   console.log(`Removed: "${phrase}"`);
 * });
 * ```
 */
export function getRedlinedPhrases(text: string): string[] {
  const spans = findRedlines(text);
  return [...new Set(spans.map((s) => s.text.toLowerCase()))];
}

/**
 * Check if text contains any manipulative or promotional language.
 *
 * Quick boolean check useful for conditional UI (e.g., showing a
 * "transparency available" badge). More efficient than checking
 * `findRedlines(text).length > 0` when you don't need the span details.
 *
 * @param text - The text content to analyze
 * @returns True if any manipulative patterns were detected
 *
 * @example
 * ```typescript
 * if (hasManipulativeLanguage(headline)) {
 *   showTransparencyBadge();
 * }
 * ```
 */
export function hasManipulativeLanguage(text: string): boolean {
  return findRedlines(text).length > 0;
}
