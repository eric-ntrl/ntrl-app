/**
 * NTRL Design System - Phase 1
 *
 * Visual target: "A calm sunny morning with blue skies and coffee"
 * - Warm off-white backgrounds (no pure white)
 * - Dark gray text (no pure black)
 * - Single muted accent for dividers
 * - Soft highlights for transparency view
 */

export const colors = {
  // Backgrounds
  background: '#FAF9F6',        // Warm off-white / paper tone
  surface: '#FFFFFF',           // Card surfaces (subtle contrast)

  // Text hierarchy
  textPrimary: '#2D2D2D',       // Dark gray for headlines and body
  textSecondary: '#5C5C5C',     // Medium gray for summaries
  textMuted: '#8A8A8A',         // Light gray for metadata (source, time)
  textSubtle: '#A3A3A3',        // Even lighter for section headers

  // Accent (used sparingly - dividers and chrome only)
  accent: '#7A8B99',            // Muted blue-gray / slate

  // Dividers
  divider: '#E8E6E1',           // Warm gray divider
  dividerSubtle: '#F0EEEA',     // Very subtle divider

  // Transparency highlights (soft, low-opacity, never alert red)
  highlight: 'rgba(212, 175, 55, 0.20)',      // Soft gold/amber at 20%
  highlightBorder: 'rgba(212, 175, 55, 0.40)', // Slightly stronger for underline

  // Interactive
  link: '#5C7A8A',              // Muted teal-gray for links
  linkPressed: '#4A6270',       // Darker on press
};

export const typography = {
  // Brand
  brand: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },

  // Date in header
  date: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },

  // Section headers (ALL CAPS per spec)
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: colors.textSubtle,
  },

  // Article card headline
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    color: colors.textPrimary,
  },

  // Article card summary
  summary: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  // Metadata (Source · Time)
  meta: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },

  // Article detail headline (larger)
  detailHeadline: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    color: colors.textPrimary,
  },

  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.textPrimary,
  },

  // Section titles in article detail
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    color: colors.textSubtle,
  },

  // Disclosure text
  disclosure: {
    fontSize: 13,
    fontWeight: '400' as const,
    fontStyle: 'italic' as const,
    color: colors.textMuted,
  },

  // Links
  link: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.link,
  },

  // End of feed message
  endMessage: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },

  endDate: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textSubtle,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const layout = {
  screenPadding: 20,
  cardPadding: 16,
  sectionGap: 24,
  itemGap: 16,
};
