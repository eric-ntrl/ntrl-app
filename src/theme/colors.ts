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
  highlight: 'rgba(212, 175, 55, 0.20)', // Soft gold/amber at 20%
  highlightBorder: 'rgba(212, 175, 55, 0.40)', // Slightly stronger for underline

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
};

// V2 Colors - Refresh (adds sage accent)
export const colorsV2: ThemeColors = {
  ...baseColors,
  accent: '#7A8B99', // Blue-gray unchanged - dividers, chrome
  accentSecondary: '#8B9A7A', // NEW: Sage - positive states (Saved)
  accentSecondaryMuted: '#A3B094', // Light sage - hover states
  accentSecondarySubtle: 'rgba(139, 154, 122, 0.15)', // Chip selected backgrounds
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
  highlight: 'rgba(240, 235, 227, 0.08)',
  highlightBorder: 'rgba(240, 235, 227, 0.15)',

  // Interactive - sage for dark mode links
  link: '#9AAE8A',
  linkPressed: '#B3C4A5',
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

  // Soft warm highlights
  highlight: 'rgba(240, 235, 227, 0.08)',
  highlightBorder: 'rgba(240, 235, 227, 0.15)',

  // Interactive - sage for dark mode links
  link: '#9AAE8A',
  linkPressed: '#B3C4A5',
};
