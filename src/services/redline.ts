/**
 * Redline Detection Service
 * Identifies manipulative, sensational, clickbait, and CTA language in text
 */

export type RedlineSpan = {
  start: number;
  end: number;
  text: string;
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
 * Find all redlines (manipulative language spans) in text
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
 * Get list of detected manipulative phrases (for display)
 */
export function getRedlinedPhrases(text: string): string[] {
  const spans = findRedlines(text);
  return [...new Set(spans.map((s) => s.text.toLowerCase()))];
}

/**
 * Check if text contains manipulative language
 */
export function hasManipulativeLanguage(text: string): boolean {
  return findRedlines(text).length > 0;
}
