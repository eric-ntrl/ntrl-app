/**
 * Detail Summary Service
 * Generates calm, neutral summaries from article detail fields
 */

/**
 * Words/phrases to remove or tone down
 */
const SENSATIONAL_WORDS = [
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
  'slams',
  'blasts',
  'destroys',
  'annihilates',
  'crushes',
  'eviscerates',
  'rips',
  'outrage',
  'fury',
  'backlash',
  'firestorm',
  'uproar',
  'unprecedented',
  'massive',
  'huge',
  'enormous',
  'incredible',
  'unbelievable',
  'breaking',
  'urgent',
  'must',
  'dangerously',
  'alarming',
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
 * Create a minimal fallback summary from detail fields
 * Used when backend detail is minimal
 */
export function createFallbackSummary(detail: {
  title?: string;
  brief?: string;
  full?: string | null;
}): string[] {
  const parts: string[] = [];

  // Use brief as primary fallback content
  if (detail.brief) {
    const cleaned = neutralizeSentence(detail.brief);
    if (cleaned.length > 30 && !FILLER_PHRASES.some((f) => cleaned.toLowerCase().includes(f))) {
      parts.push(cleaned);
    }
  }

  // If brief is empty but we have full content, extract first sentences
  if (parts.length === 0 && detail.full) {
    const sentences = detail.full.match(/[^.!?]+[.!?]+/g) || [];
    const firstSentences = sentences.slice(0, 3).join('').trim();
    if (firstSentences.length > 30) {
      const cleaned = neutralizeSentence(firstSentences);
      if (!FILLER_PHRASES.some((f) => cleaned.toLowerCase().includes(f))) {
        parts.push(cleaned);
      }
    }
  }

  // Return as single paragraph if we have content
  if (parts.length > 0) {
    return [parts.join(' ')];
  }

  return [];
}
