/**
 * Detail Summary Service
 * Generates calm, neutral summaries from extracted article text
 *
 * Output: 2-3 short paragraphs OR 8-10 sentences max
 * Tone: Calm, factual, neutral - no sensationalism
 * No rubric labels - organic narrative flow only
 */

// Target sentence range
const MIN_SENTENCES = 4;
const MAX_SENTENCES = 10;

// Target paragraph range
const MIN_PARAGRAPHS = 2;
const MAX_PARAGRAPHS = 3;

// Minimum input length to attempt full summary
const MIN_INPUT_LENGTH = 300;

// Minimum output length to be considered substantial
const MIN_OUTPUT_LENGTH = 200;

/**
 * Words/phrases to remove or tone down
 */
const SENSATIONAL_WORDS = [
  'shocking', 'stunning', 'explosive', 'bombshell', 'devastating',
  'horrifying', 'terrifying', 'nightmare', 'chaos', 'crisis',
  'catastrophe', 'disaster', 'slams', 'blasts', 'destroys',
  'annihilates', 'crushes', 'eviscerates', 'rips', 'outrage',
  'fury', 'backlash', 'firestorm', 'uproar', 'unprecedented',
  'massive', 'huge', 'enormous', 'incredible', 'unbelievable',
  'breaking', 'urgent', 'must', 'dangerously', 'alarming',
];

/**
 * Filler phrases to avoid
 */
const FILLER_PHRASES = [
  'more detail may be available',
  'details available in the full article',
  'see full article for details',
  'additional context',
  'for more information',
];

/**
 * Split text into sentences with proper boundary detection
 */
function splitIntoSentences(text: string): string[] {
  // Handle common abbreviations to avoid false splits
  const preprocessed = text
    .replace(/Mr\./g, 'Mr\u0000')
    .replace(/Mrs\./g, 'Mrs\u0000')
    .replace(/Ms\./g, 'Ms\u0000')
    .replace(/Dr\./g, 'Dr\u0000')
    .replace(/Prof\./g, 'Prof\u0000')
    .replace(/vs\./g, 'vs\u0000')
    .replace(/U\.S\./g, 'US')
    .replace(/U\.K\./g, 'UK')
    .replace(/i\.e\./gi, 'ie')
    .replace(/e\.g\./gi, 'eg')
    .replace(/etc\./gi, 'etc');

  // Split on sentence boundaries
  const sentences = preprocessed.split(/(?<=[.!?])\s+/);

  return sentences
    .map(s => s.replace(/\u0000/g, '.').trim()) // Restore abbreviation periods
    .filter(s => s.length > 25); // Filter out very short fragments
}

/**
 * Score a sentence by informativeness
 * Higher score = more valuable for summary
 */
function scoreSentence(sentence: string, index: number, totalCount: number): number {
  let score = 0;
  const len = sentence.length;
  const lower = sentence.toLowerCase();

  // Length sweet spot (50-180 chars is ideal for readability)
  if (len >= 50 && len <= 180) score += 12;
  else if (len >= 30 && len < 50) score += 5;
  else if (len > 180 && len <= 250) score += 5;
  else if (len > 250) score -= 5;
  else if (len < 30) score -= 10;

  // Position bonuses - prefer early and mid-article sentences
  if (index === 0) score += 20; // Lead sentence
  else if (index <= 3) score += 10; // Early context
  else if (index >= totalCount - 2) score += 5; // Conclusion context

  // Contains numbers (often factual)
  if (/\d+/.test(sentence)) score += 6;

  // Contains quotes (attribution)
  if (/["']/.test(sentence)) score += 4;

  // Contains concrete nouns and verbs (who, what, where)
  const concretePatterns = [
    /\b(government|official|minister|president|company|organization|police|court|judge|agency)\b/i,
    /\b(said|announced|reported|confirmed|stated|according to|told)\b/i,
    /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
    /\b(percent|million|billion|thousand|hundred)\b/i,
  ];
  for (const pattern of concretePatterns) {
    if (pattern.test(sentence)) score += 4;
  }

  // Penalize sensational language
  for (const word of SENSATIONAL_WORDS) {
    if (lower.includes(word)) score -= 6;
  }

  // Penalize filler phrases
  for (const phrase of FILLER_PHRASES) {
    if (lower.includes(phrase)) score -= 15;
  }

  // Penalize questions (often clickbait)
  if (sentence.endsWith('?')) score -= 10;

  // Penalize sentences starting with "But" or "And" (fragment-like)
  if (/^(But|And|So|Or)\s/i.test(sentence)) score -= 3;

  return score;
}

/**
 * Remove or replace sensational words
 */
function neutralizeSentence(sentence: string): string {
  let result = sentence;

  // Remove common sensational prefixes
  result = result.replace(/^(Breaking|Urgent|Exclusive|Shocking|Just In):\s*/i, '');

  // Tone down certain words
  const replacements: Array<[RegExp, string]> = [
    [/\bslams\b/gi, 'criticizes'],
    [/\bblasts\b/gi, 'criticizes'],
    [/\brips\b/gi, 'criticizes'],
    [/\bdestroys\b/gi, 'refutes'],
    [/\bshocking\b/gi, 'notable'],
    [/\bstunning\b/gi, 'notable'],
    [/\bexplosive\b/gi, 'significant'],
    [/\bmassive\b/gi, 'substantial'],
    [/\bhuge\b/gi, 'significant'],
    [/\bcrisis\b/gi, 'situation'],
    [/\bchaos\b/gi, 'disruption'],
    [/\bdisaster\b/gi, 'incident'],
    [/\bbreaking\b/gi, 'developing'],
  ];

  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }

  // Remove excessive punctuation
  result = result.replace(/!{2,}/g, '.');
  result = result.replace(/\?{2,}/g, '?');
  result = result.replace(/\.{3,}/g, '.');

  return result.trim();
}

/**
 * Group sentences into paragraphs for readable flow
 * Targets 3-4 sentences per paragraph
 */
function groupIntoParagraphs(sentences: string[]): string[] {
  const count = sentences.length;

  if (count <= 4) {
    // Single paragraph for short content
    return [sentences.join(' ')];
  }

  if (count <= 7) {
    // Two paragraphs
    const midpoint = Math.ceil(count / 2);
    return [
      sentences.slice(0, midpoint).join(' '),
      sentences.slice(midpoint).join(' '),
    ];
  }

  // Three paragraphs for longer content
  const third = Math.ceil(count / 3);
  return [
    sentences.slice(0, third).join(' '),
    sentences.slice(third, third * 2).join(' '),
    sentences.slice(third * 2).join(' '),
  ].filter(p => p.length > 0);
}

/**
 * Generate a calm, neutral detail summary from extracted article text
 * Returns 2-3 paragraphs with 8-10 sentences total, no rubric labels
 */
export function makeCalmDetailSummary(originalText: string): string[] {
  if (!originalText || originalText.length < MIN_INPUT_LENGTH) {
    // Input too thin - return empty to trigger fallback
    return [];
  }

  // Split into sentences
  const allSentences = splitIntoSentences(originalText);
  const totalCount = allSentences.length;

  if (totalCount < MIN_SENTENCES) {
    // Not enough sentences for a proper summary
    return [];
  }

  // Score each sentence
  const scored = allSentences.map((sentence, index) => ({
    sentence,
    score: scoreSentence(sentence, index, totalCount),
    index,
  }));

  // Select top sentences by score, but cap at MAX_SENTENCES
  // Filter out very low scoring sentences
  const candidates = scored
    .filter(s => s.score > -5)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SENTENCES);

  // Re-sort by original order to maintain narrative flow
  candidates.sort((a, b) => a.index - b.index);

  // Ensure we have minimum sentences
  if (candidates.length < MIN_SENTENCES) {
    return [];
  }

  // Neutralize each sentence
  const neutralized = candidates.map(s => neutralizeSentence(s.sentence));

  // Filter out any empty results
  const validSentences = neutralized.filter(s => s.length > 20);

  if (validSentences.length < MIN_SENTENCES) {
    return [];
  }

  // Group into paragraphs
  const paragraphs = groupIntoParagraphs(validSentences);

  // Validate output length
  const totalLength = paragraphs.join(' ').length;
  if (totalLength < MIN_OUTPUT_LENGTH) {
    return [];
  }

  return paragraphs;
}

/**
 * Check if extracted text has enough substance for a full summary
 */
export function hasSubstantiveContent(text: string): boolean {
  if (!text) return false;
  const sentences = splitIntoSentences(text);
  return sentences.length >= MIN_SENTENCES && text.length >= MIN_INPUT_LENGTH;
}

/**
 * Create a minimal fallback summary from RSS detail fields
 * Used when reader-mode extraction fails or is too thin
 */
export function createFallbackSummary(detail: {
  what_happened?: string;
  why_it_matters?: string;
}): string[] {
  const parts: string[] = [];

  if (detail.what_happened) {
    const cleaned = neutralizeSentence(detail.what_happened);
    if (cleaned.length > 30 && !FILLER_PHRASES.some(f => cleaned.toLowerCase().includes(f))) {
      parts.push(cleaned);
    }
  }

  if (detail.why_it_matters) {
    const cleaned = neutralizeSentence(detail.why_it_matters);
    if (cleaned.length > 30 && !FILLER_PHRASES.some(f => cleaned.toLowerCase().includes(f))) {
      parts.push(cleaned);
    }
  }

  // Return as single paragraph if we have content
  if (parts.length > 0) {
    return [parts.join(' ')];
  }

  return [];
}
