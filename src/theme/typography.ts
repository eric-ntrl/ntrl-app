/**
 * NTRL Theme System - Typography
 *
 * V1: Original typography values
 * V2: Refined for premium publishing feel (NYTimes/Apple News quality)
 *
 * Text size scaling only affects reading-critical text:
 * - Headlines, body, summaries
 * NOT scaled: section headers, meta, UI chrome
 */

import type { ThemeTypography, TextSizePreference, ThemeColors } from './types';

// Text size multipliers
const TEXT_SIZE_MULTIPLIERS: Record<TextSizePreference, number> = {
  small: 0.9,
  medium: 1.0,
  large: 1.15,
};

// V1 Typography - Original values
export function createTypographyV1(colors: ThemeColors): ThemeTypography {
  return {
    brand: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: 1,
    },
    date: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textMuted,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: colors.textSubtle,
    },
    headline: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      color: colors.textPrimary,
    },
    summary: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 21,
      color: colors.textSecondary,
    },
    meta: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
    },
    detailHeadline: {
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 28,
      color: colors.textPrimary,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      color: colors.textPrimary,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textSubtle,
    },
    disclosure: {
      fontSize: 13,
      fontWeight: '400',
      fontStyle: 'italic',
      color: colors.textMuted,
    },
    link: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.link,
    },
    endMessage: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textMuted,
    },
    endDate: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textSubtle,
    },
  };
}

// V2 Typography Base - Refined values (before text size scaling)
const typographyV2Base = {
  brand: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  date: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  // Quieter section headers - smaller, lighter weight, more spacing
  sectionHeader: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 2.0,
    textTransform: 'uppercase' as const,
  },
  // Refined headlines - slightly larger, better line-height, tighter tracking
  headline: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  // More generous line-height for summaries
  summary: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 23,
    letterSpacing: 0.1,
  },
  // Quieter meta text
  meta: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  // Premium detail headlines
  detailHeadline: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 33,
    letterSpacing: -0.4,
  },
  // Refined body text
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 30,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  disclosure: {
    fontSize: 13,
    fontWeight: '400' as const,
    fontStyle: 'italic' as const,
  },
  link: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  endMessage: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  endDate: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
};

// Create V2 typography with text size scaling applied
export function createTypographyV2(
  colors: ThemeColors,
  textSize: TextSizePreference
): ThemeTypography {
  const multiplier = TEXT_SIZE_MULTIPLIERS[textSize];

  // Helper to scale a value
  const scale = (value: number) => Math.round(value * multiplier);

  return {
    brand: {
      ...typographyV2Base.brand,
    },
    date: {
      ...typographyV2Base.date,
      color: colors.textMuted,
    },
    sectionHeader: {
      ...typographyV2Base.sectionHeader,
      color: colors.textMuted, // Slightly more present than textSubtle
    },
    // Scale headlines
    headline: {
      ...typographyV2Base.headline,
      fontSize: scale(typographyV2Base.headline.fontSize),
      lineHeight: scale(typographyV2Base.headline.lineHeight),
      color: colors.textPrimary,
    },
    // Scale summaries
    summary: {
      ...typographyV2Base.summary,
      fontSize: scale(typographyV2Base.summary.fontSize),
      lineHeight: scale(typographyV2Base.summary.lineHeight),
      color: colors.textSecondary,
    },
    meta: {
      ...typographyV2Base.meta,
      color: colors.textMuted,
    },
    // Scale detail headlines
    detailHeadline: {
      ...typographyV2Base.detailHeadline,
      fontSize: scale(typographyV2Base.detailHeadline.fontSize),
      lineHeight: scale(typographyV2Base.detailHeadline.lineHeight),
      color: colors.textPrimary,
    },
    // Scale body text
    body: {
      ...typographyV2Base.body,
      fontSize: scale(typographyV2Base.body.fontSize),
      lineHeight: scale(typographyV2Base.body.lineHeight),
      color: colors.textPrimary,
    },
    sectionTitle: {
      ...typographyV2Base.sectionTitle,
      color: colors.textSubtle,
    },
    disclosure: {
      ...typographyV2Base.disclosure,
      color: colors.textMuted,
    },
    link: {
      ...typographyV2Base.link,
      color: colors.link,
    },
    endMessage: {
      ...typographyV2Base.endMessage,
      color: colors.textMuted,
    },
    endDate: {
      ...typographyV2Base.endDate,
      color: colors.textSubtle,
    },
  };
}
