/**
 * NTRL Theme System - Color Definitions
 *
 * V1: Original color scheme
 * V2: Adds sage/olive green as secondary accent
 */

import type { ThemeColors } from './types';

// Shared base colors (unchanged between versions)
const baseColors = {
  // Backgrounds
  background: '#FAF9F6', // Warm off-white / paper tone
  surface: '#FFFFFF', // Card surfaces (subtle contrast)

  // Text hierarchy
  textPrimary: '#2D2D2D', // Dark gray for headlines and body
  textSecondary: '#5C5C5C', // Medium gray for summaries
  textMuted: '#8A8A8A', // Light gray for metadata (source, time)
  textSubtle: '#A3A3A3', // Even lighter for section headers

  // Dividers
  divider: '#E8E6E1', // Warm gray divider
  dividerSubtle: '#F0EEEA', // Very subtle divider

  // Transparency highlights (soft, low-opacity, never alert red)
  // Default/fallback highlight
  highlight: 'rgba(195, 165, 75, 0.50)', // Ochre at 50% for visibility
  highlightBorder: 'rgba(195, 165, 75, 0.65)', // Slightly stronger for underline

  // Category-specific highlights - EARTH TONES for calm aesthetic
  // Design philosophy: "Reading with warm lamplight, not alarm signals"
  // All colors have similar saturation/brightness for harmony
  highlightUrgency: 'rgba(180, 130, 100, 0.30)', // Clay/terracotta - urgency inflation
  highlightEmotional: 'rgba(140, 155, 120, 0.30)', // Sage - emotional triggers
  highlightEditorial: 'rgba(155, 140, 115, 0.30)', // Warm stone - editorial voice
  highlightClickbait: 'rgba(185, 150, 95, 0.30)', // Sienna/sand - clickbait

  // L1 Category highlights - NTRL taxonomy (light mode)
  highlightAttention: 'rgba(180, 130, 100, 0.30)', // Clay/terracotta - attention & engagement
  highlightCognitive: 'rgba(155, 140, 115, 0.30)', // Warm stone - cognitive & epistemic
  highlightFraming: 'rgba(195, 165, 75, 0.50)', // Ochre - linguistic & framing
  highlightStructural: 'rgba(165, 145, 125, 0.30)', // Umber - structural & editorial
  highlightIncentive: 'rgba(185, 150, 95, 0.30)', // Sienna/sand - incentive & meta

  // Interactive
  link: '#5C7A8A', // Muted teal-gray for links
  linkPressed: '#4A6270', // Darker on press
};

// V1 Colors - Original (single accent)
export const colorsV1: ThemeColors = {
  ...baseColors,
  accent: '#7A8B99', // Muted blue-gray / slate
  accentSecondary: '#7A8B99', // Same as primary in v1
  accentSecondaryMuted: '#7A8B99',
  accentSecondarySubtle: 'rgba(122, 139, 153, 0.1)',
  tabBarActiveBackground: 'rgba(122, 139, 153, 0.12)', // accent at 12% opacity
};

// V2 Colors - Refresh (adds sage accent)
export const colorsV2: ThemeColors = {
  ...baseColors,
  accent: '#7A8B99', // Blue-gray unchanged - dividers, chrome
  accentSecondary: '#8B9A7A', // NEW: Sage - positive states (Saved)
  accentSecondaryMuted: '#A3B094', // Light sage - hover states
  accentSecondarySubtle: 'rgba(139, 154, 122, 0.15)', // Chip selected backgrounds
  tabBarActiveBackground: 'rgba(122, 139, 153, 0.12)', // accent at 12% opacity
};

/**
 * Dark Mode Colors - "Warm Reading Light"
 *
 * Design vision: "Reading your favorite book, snuggled up in bed,
 * warm reading light, cup of calming tea"
 *
 * NOT a cold, stark dark mode. Instead: warm, sepia-toned,
 * like reading by lamplight.
 */

// V1 Dark - Original accent in dark mode
export const colorsV1Dark: ThemeColors = {
  // Warm dark backgrounds - like a leather reading chair
  background: '#1A1816',
  surface: '#262220',

  // Warm cream text - like parchment in lamplight
  textPrimary: '#F0EBE3',
  textSecondary: '#D4CFC6',
  textMuted: '#A09A91',
  textSubtle: '#706B63',

  // Accents (lightened for dark backgrounds)
  accent: '#8FA0AD', // Blue-gray lightened
  accentSecondary: '#8FA0AD', // Same as primary in v1
  accentSecondaryMuted: '#8FA0AD',
  accentSecondarySubtle: 'rgba(143, 160, 173, 0.15)',

  // Warm dividers
  divider: '#3A3633',
  dividerSubtle: '#2E2A27',

  // Soft warm highlights
  highlight: 'rgba(195, 165, 75, 0.40)', // Ochre at 40% for dark mode visibility
  highlightBorder: 'rgba(195, 165, 75, 0.55)',

  // Category-specific highlights - reduced opacity for dark mode
  highlightUrgency: 'rgba(180, 130, 100, 0.25)', // Clay/terracotta
  highlightEmotional: 'rgba(140, 155, 120, 0.25)', // Sage
  highlightEditorial: 'rgba(155, 140, 115, 0.25)', // Warm stone
  highlightClickbait: 'rgba(185, 150, 95, 0.25)', // Sienna/sand

  // L1 Category highlights - NTRL taxonomy (dark mode, reduced opacity)
  highlightAttention: 'rgba(180, 130, 100, 0.25)', // Clay/terracotta
  highlightCognitive: 'rgba(155, 140, 115, 0.25)', // Warm stone
  highlightFraming: 'rgba(195, 165, 75, 0.40)', // Ochre
  highlightStructural: 'rgba(165, 145, 125, 0.25)', // Umber
  highlightIncentive: 'rgba(185, 150, 95, 0.25)', // Sienna/sand

  // Interactive - sage for dark mode links
  link: '#9AAE8A',
  linkPressed: '#B3C4A5',

  // Tab bar
  tabBarActiveBackground: 'rgba(143, 160, 173, 0.15)', // lightened accent at 15%
};

// V2 Dark - Sage accent in dark mode (current refresh)
export const colorsV2Dark: ThemeColors = {
  // Warm dark backgrounds - like a leather reading chair
  background: '#1A1816',
  surface: '#262220',

  // Warm cream text - like parchment in lamplight
  textPrimary: '#F0EBE3',
  textSecondary: '#D4CFC6',
  textMuted: '#A09A91',
  textSubtle: '#706B63',

  // Accents (lightened for dark backgrounds)
  accent: '#8FA0AD', // Blue-gray lightened
  accentSecondary: '#9AAE8A', // Sage lightened for dark
  accentSecondaryMuted: '#B3C4A5', // Light sage
  accentSecondarySubtle: 'rgba(154, 174, 138, 0.2)', // Sage chip backgrounds

  // Warm dividers
  divider: '#3A3633',
  dividerSubtle: '#2E2A27',

  // Soft warm highlights - ochre for visibility
  highlight: 'rgba(195, 165, 75, 0.40)', // Ochre at 40% for dark mode visibility
  highlightBorder: 'rgba(195, 165, 75, 0.55)',

  // Category-specific highlights - reduced opacity for dark mode
  highlightUrgency: 'rgba(180, 130, 100, 0.25)', // Clay/terracotta
  highlightEmotional: 'rgba(140, 155, 120, 0.25)', // Sage
  highlightEditorial: 'rgba(155, 140, 115, 0.25)', // Warm stone
  highlightClickbait: 'rgba(185, 150, 95, 0.25)', // Sienna/sand

  // L1 Category highlights - NTRL taxonomy (dark mode, reduced opacity)
  highlightAttention: 'rgba(180, 130, 100, 0.25)', // Clay/terracotta
  highlightCognitive: 'rgba(155, 140, 115, 0.25)', // Warm stone
  highlightFraming: 'rgba(195, 165, 75, 0.40)', // Ochre
  highlightStructural: 'rgba(165, 145, 125, 0.25)', // Umber
  highlightIncentive: 'rgba(185, 150, 95, 0.25)', // Sienna/sand

  // Interactive - sage for dark mode links
  link: '#9AAE8A',
  linkPressed: '#B3C4A5',

  // Tab bar
  tabBarActiveBackground: 'rgba(143, 160, 173, 0.15)', // lightened accent at 15%
};

/**
 * Sepia Mode Colors - "Warm Reading Light for Low Light"
 *
 * Design vision: Like reading a vintage paperback by candlelight.
 * Warm cream and tan tones that are gentle on the eyes in dim environments.
 */

// V1 Sepia - Original accent in sepia mode
export const colorsV1Sepia: ThemeColors = {
  // Warm sepia backgrounds - cream and parchment
  background: '#F5EFE6',
  surface: '#FBF8F3',

  // Warm brown text for comfortable reading
  textPrimary: '#3D3225',
  textSecondary: '#5C5246',
  textMuted: '#7A7064',
  textSubtle: '#9A8F83',

  // Accents (unchanged)
  accent: '#7A8B99',
  accentSecondary: '#7A8B99',
  accentSecondaryMuted: '#7A8B99',
  accentSecondarySubtle: 'rgba(122, 139, 153, 0.1)',

  // Warm sepia dividers
  divider: '#E5DED4',
  dividerSubtle: '#EDE7DF',

  // Soft warm highlights - slightly warmer than light mode
  highlight: 'rgba(195, 165, 75, 0.45)',
  highlightBorder: 'rgba(195, 165, 75, 0.60)',

  // Category-specific highlights
  highlightUrgency: 'rgba(180, 130, 100, 0.28)',
  highlightEmotional: 'rgba(140, 155, 120, 0.28)',
  highlightEditorial: 'rgba(155, 140, 115, 0.28)',
  highlightClickbait: 'rgba(185, 150, 95, 0.28)',

  // L1 Category highlights
  highlightAttention: 'rgba(180, 130, 100, 0.28)',
  highlightCognitive: 'rgba(155, 140, 115, 0.28)',
  highlightFraming: 'rgba(195, 165, 75, 0.45)',
  highlightStructural: 'rgba(165, 145, 125, 0.28)',
  highlightIncentive: 'rgba(185, 150, 95, 0.28)',

  // Interactive
  link: '#6B7A64',
  linkPressed: '#556050',

  // Tab bar
  tabBarActiveBackground: 'rgba(122, 139, 153, 0.12)',
};

// V2 Sepia - Sage accent in sepia mode (current refresh)
export const colorsV2Sepia: ThemeColors = {
  // Warm sepia backgrounds - cream and parchment
  background: '#F5EFE6',
  surface: '#FBF8F3',

  // Warm brown text for comfortable reading
  textPrimary: '#3D3225',
  textSecondary: '#5C5246',
  textMuted: '#7A7064',
  textSubtle: '#9A8F83',

  // Accents with sage (v2)
  accent: '#7A8B99',
  accentSecondary: '#8B9A7A',
  accentSecondaryMuted: '#A3B094',
  accentSecondarySubtle: 'rgba(139, 154, 122, 0.15)',

  // Warm sepia dividers
  divider: '#E5DED4',
  dividerSubtle: '#EDE7DF',

  // Soft warm highlights
  highlight: 'rgba(195, 165, 75, 0.45)',
  highlightBorder: 'rgba(195, 165, 75, 0.60)',

  // Category-specific highlights
  highlightUrgency: 'rgba(180, 130, 100, 0.28)',
  highlightEmotional: 'rgba(140, 155, 120, 0.28)',
  highlightEditorial: 'rgba(155, 140, 115, 0.28)',
  highlightClickbait: 'rgba(185, 150, 95, 0.28)',

  // L1 Category highlights
  highlightAttention: 'rgba(180, 130, 100, 0.28)',
  highlightCognitive: 'rgba(155, 140, 115, 0.28)',
  highlightFraming: 'rgba(195, 165, 75, 0.45)',
  highlightStructural: 'rgba(165, 145, 125, 0.28)',
  highlightIncentive: 'rgba(185, 150, 95, 0.28)',

  // Interactive - sage green for sepia mode
  link: '#6B7A64',
  linkPressed: '#556050',

  // Tab bar
  tabBarActiveBackground: 'rgba(122, 139, 153, 0.12)',
};
