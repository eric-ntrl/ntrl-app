/**
 * NTRL Taxonomy Utilities
 *
 * Maps backend SpanReasons to Level 1 (L1) manipulation categories
 * and provides metadata for each category.
 *
 * Also provides direct SpanReason metadata for more granular display.
 */

import type { SpanReason, L1Category } from '../navigation/types';

/**
 * Metadata for each SpanReason (backend category).
 * Provides more granular information than L1 categories.
 */
export type SpanReasonMetadata = {
  /** Short display name for lists */
  shortName: string;
  /** Full descriptive name */
  fullName: string;
  /** Brief explanation of the harm */
  harmExplanation: string;
  /** Detailed "Why it matters" explanation */
  whyItMatters: string;
  /** Key for the highlight color in theme colors */
  colorKey: string;
};

/**
 * Complete metadata for all SpanReasons.
 * Used for detail sheets and category displays.
 */
export const SPAN_REASON_METADATA: Record<SpanReason, SpanReasonMetadata> = {
  urgency_inflation: {
    shortName: 'Urgency',
    fullName: 'Urgency Inflation',
    harmExplanation: 'Creates artificial time pressure',
    whyItMatters:
      'BREAKING, JUST IN, and "act now" language triggers anxiety and impulsive reading rather than thoughtful engagement.',
    colorKey: 'highlightAttention',
  },
  clickbait: {
    shortName: 'Clickbait',
    fullName: 'Clickbait Language',
    harmExplanation: 'Withholds information to force clicks',
    whyItMatters:
      'Phrases like "You won\'t believe" exploit curiosity gaps, prioritizing engagement over informing you.',
    colorKey: 'highlightAttention',
  },
  emotional_trigger: {
    shortName: 'Emotional',
    fullName: 'Emotional Triggers',
    harmExplanation: 'Hijacks emotions to bypass rational analysis',
    whyItMatters:
      'Words like "shocking", "devastating", and "slams" prime emotional responses before you can process the facts.',
    colorKey: 'highlightEmotional',
  },
  agenda_signaling: {
    shortName: 'Agenda',
    fullName: 'Agenda Signaling',
    harmExplanation: 'Signals political or ideological stance',
    whyItMatters:
      'Labels like "radical", "extremist", or "so-called" prejudge subjects and signal how you should feel about them.',
    colorKey: 'highlightCognitive',
  },
  rhetorical_framing: {
    shortName: 'Loaded Verbs',
    fullName: 'Loaded Verbs & Idioms',
    harmExplanation: 'Uses charged language to imply judgment',
    whyItMatters:
      'Verbs like "slammed", "blasted", "admits", or idioms like "came under fire" carry editorial judgment disguised as neutral reporting.',
    colorKey: 'highlightFraming',
  },
  editorial_voice: {
    shortName: 'Editorial',
    fullName: 'Editorial Voice',
    harmExplanation: 'Inserts opinion into news reporting',
    whyItMatters:
      'Phrases like "as it should be", invented titles like "Border Czar", or "we\'re glad to report" inject opinion into what should be factual news.',
    colorKey: 'highlightStructural',
  },
  selling: {
    shortName: 'Selling',
    fullName: 'Selling & Hype',
    harmExplanation: 'Promotes products or ideas as news',
    whyItMatters:
      'Words like "revolutionary", "game-changer", "must-have" blur the line between news and advertising.',
    colorKey: 'highlightIncentive',
  },
};

/**
 * All SpanReasons in display order.
 */
export const SPAN_REASONS: SpanReason[] = [
  'urgency_inflation',
  'clickbait',
  'emotional_trigger',
  'agenda_signaling',
  'rhetorical_framing',
  'editorial_voice',
  'selling',
];

/**
 * Maps a SpanReason to its L1 category.
 */
export function mapSpanReasonToL1Category(reason: SpanReason): L1Category {
  switch (reason) {
    case 'urgency_inflation':
      return 'attention_engagement';
    case 'clickbait':
      return 'attention_engagement';
    case 'emotional_trigger':
      return 'emotional_affective';
    case 'agenda_signaling':
      return 'cognitive_epistemic';
    case 'rhetorical_framing':
      return 'linguistic_framing';
    case 'editorial_voice':
      return 'structural_editorial';
    case 'selling':
      return 'incentive_meta';
    default:
      return 'linguistic_framing'; // Fallback
  }
}

/**
 * Metadata for each L1 category.
 */
export type L1CategoryMetadata = {
  /** Display name for the category */
  shortName: string;
  /** Full descriptive name */
  fullName: string;
  /** Brief explanation of the harm */
  harmExplanation: string;
  /** Detailed "Why it matters" explanation */
  whyItMatters: string;
  /** Key for the highlight color in theme colors */
  colorKey: string;
};

/**
 * Complete metadata for all L1 categories.
 */
export const L1_CATEGORY_METADATA: Record<L1Category, L1CategoryMetadata> = {
  attention_engagement: {
    shortName: 'Attention',
    fullName: 'Attention & Engagement',
    harmExplanation: 'Creates artificial urgency and anxiety',
    whyItMatters:
      'Headlines and phrases designed to grab attention often trigger stress responses, making you feel like you must read immediately or miss out.',
    colorKey: 'highlightAttention',
  },
  emotional_affective: {
    shortName: 'Emotional',
    fullName: 'Emotional & Affective',
    harmExplanation: 'Hijacks emotions to bypass rational analysis',
    whyItMatters:
      'Emotionally charged language can manipulate how you feel before you even process the facts, leading to reactive rather than thoughtful responses.',
    colorKey: 'highlightEmotional',
  },
  cognitive_epistemic: {
    shortName: 'Cognitive',
    fullName: 'Cognitive & Epistemic',
    harmExplanation: 'Undermines ability to assess truth',
    whyItMatters:
      'These techniques distort your perception of facts, making it harder to distinguish reliable information from speculation or bias.',
    colorKey: 'highlightCognitive',
  },
  linguistic_framing: {
    shortName: 'Framing',
    fullName: 'Linguistic & Framing',
    harmExplanation: 'Shapes interpretation before conscious evaluation',
    whyItMatters:
      'Subtle word choices can prime how you interpret events, often steering you toward a particular conclusion without presenting explicit arguments.',
    colorKey: 'highlightFraming',
  },
  structural_editorial: {
    shortName: 'Editorial',
    fullName: 'Structural & Editorial',
    harmExplanation: 'Deceives through emphasis or omission',
    whyItMatters:
      'What gets highlighted or buried affects what you think is important, even when all the facts are technically present.',
    colorKey: 'highlightStructural',
  },
  incentive_meta: {
    shortName: 'Commercial',
    fullName: 'Incentive & Meta',
    harmExplanation: 'Disguises promotional content as journalism',
    whyItMatters:
      'When commercial interests drive content, the line between news and advertising blurs, eroding trust in what should be objective reporting.',
    colorKey: 'highlightIncentive',
  },
};

/**
 * Get display name for an L1 category.
 */
export function getL1CategoryDisplayName(category: L1Category): string {
  return L1_CATEGORY_METADATA[category].shortName;
}

/**
 * Get full name for an L1 category.
 */
export function getL1CategoryFullName(category: L1Category): string {
  return L1_CATEGORY_METADATA[category].fullName;
}

/**
 * Get harm explanation for an L1 category.
 */
export function getL1CategoryHarmExplanation(category: L1Category): string {
  return L1_CATEGORY_METADATA[category].harmExplanation;
}

/**
 * All L1 categories in display order.
 */
export const L1_CATEGORIES: L1Category[] = [
  'attention_engagement',
  'emotional_affective',
  'cognitive_epistemic',
  'linguistic_framing',
  'structural_editorial',
  'incentive_meta',
];

/**
 * Category count for microcopy display.
 */
export type CategoryCount = {
  reason: SpanReason;
  count: number;
};

/**
 * Count transformations by SpanReason category.
 * Returns non-zero counts sorted by count descending.
 */
export function countByCategory(transformations: { reason: SpanReason }[]): CategoryCount[] {
  const counts: Record<SpanReason, number> = {
    urgency_inflation: 0,
    clickbait: 0,
    emotional_trigger: 0,
    agenda_signaling: 0,
    rhetorical_framing: 0,
    editorial_voice: 0,
    selling: 0,
  };

  for (const t of transformations) {
    if (counts[t.reason] !== undefined) {
      counts[t.reason]++;
    }
  }

  // Return non-zero counts, sorted by count descending
  return Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .map(([reason, count]) => ({ reason: reason as SpanReason, count }))
    .sort((a, b) => b.count - a.count);
}
