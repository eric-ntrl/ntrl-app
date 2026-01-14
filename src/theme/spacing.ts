/**
 * NTRL Theme System - Spacing & Layout
 *
 * 4px-based spacing scale for consistent rhythm
 */

import type { ThemeSpacing, ThemeLayout } from './types';

export const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const layout: ThemeLayout = {
  screenPadding: 20,
  cardPadding: 16,
  sectionGap: 24,
  itemGap: 16,
};
