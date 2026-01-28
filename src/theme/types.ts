/**
 * NTRL Theme System - Type Definitions
 */

export type TextSizePreference = 'small' | 'medium' | 'large';
export type ThemeVersion = 'v1' | 'v2';
export type ColorMode = 'light' | 'dark';
export type ColorModePreference = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;

  // Text hierarchy
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;

  // Accents
  accent: string;
  accentSecondary: string;
  accentSecondaryMuted: string;
  accentSecondarySubtle: string;

  // Dividers
  divider: string;
  dividerSubtle: string;

  // Highlights (transparency view) - default/fallback
  highlight: string;
  highlightBorder: string;

  // Category-specific highlights (muted, calm colors)
  highlightUrgency: string;      // Muted dusty rose - urgency inflation
  highlightEmotional: string;    // Muted slate blue - emotional triggers
  highlightEditorial: string;    // Muted lavender - editorial voice
  highlightClickbait: string;    // Muted amber/tan - clickbait

  // Interactive
  link: string;
  linkPressed: string;
}

export interface TypographyStyle {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700';
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  fontStyle?: 'normal' | 'italic';
  fontFamily?: string;
  color?: string;
}

export interface ThemeTypography {
  brand: TypographyStyle;
  date: TypographyStyle;
  sectionHeader: TypographyStyle;
  headline: TypographyStyle;
  summary: TypographyStyle;
  meta: TypographyStyle;
  detailHeadline: TypographyStyle;
  body: TypographyStyle;
  sectionTitle: TypographyStyle;
  disclosure: TypographyStyle;
  link: TypographyStyle;
  endMessage: TypographyStyle;
  endDate: TypographyStyle;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface ThemeLayout {
  screenPadding: number;
  cardPadding: number;
  sectionGap: number;
  itemGap: number;
}

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  layout: ThemeLayout;
}
