/**
 * NTRL Theme System
 *
 * Provides theming with:
 * - Version toggle (v1/v2) for rollback
 * - Text size scaling (small/medium/large)
 * - Color mode (light/dark/system)
 * - React Context for dynamic theme access
 *
 * Usage:
 *   const { theme, textSize, setTextSize, colorMode, setColorMode } = useTheme();
 *   const { colors, typography, spacing, layout } = theme;
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colorsV1, colorsV2, colorsV1Dark, colorsV2Dark } from './colors';
import { createTypographyV1, createTypographyV2 } from './typography';
import { spacing, layout } from './spacing';
import type {
  Theme,
  ThemeVersion,
  TextSizePreference,
  ColorMode,
  ColorModePreference,
} from './types';

// Re-export types
export type {
  Theme,
  ThemeVersion,
  TextSizePreference,
  ColorMode,
  ColorModePreference,
} from './types';

// Re-export spacing and layout for direct imports
export { spacing, layout } from './spacing';

// ============================================
// Theme Version Toggle - Change here for rollback
// ============================================
const ACTIVE_THEME_VERSION: ThemeVersion = 'v2';

// ============================================
// Theme Context
// ============================================

interface ThemeContextValue {
  theme: Theme;
  textSize: TextSizePreference;
  setTextSize: (size: TextSizePreference) => Promise<void>;
  colorMode: ColorMode;
  colorModePreference: ColorModePreference;
  setColorMode: (mode: ColorModePreference) => Promise<void>;
  themeVersion: ThemeVersion;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [textSize, setTextSizeState] = useState<TextSizePreference>('medium');
  const [colorModePreference, setColorModePreferenceState] =
    useState<ColorModePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Get system color scheme
  const systemColorScheme = useColorScheme();

  // Resolve actual color mode from preference
  const colorMode: ColorMode = useMemo(() => {
    if (colorModePreference === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return colorModePreference;
  }, [colorModePreference, systemColorScheme]);

  // Load preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        // Dynamic import to avoid circular dependency
        const { getPreferences } = await import('../storage/storageService');
        const prefs = await getPreferences();
        if (prefs.textSize) {
          setTextSizeState(prefs.textSize);
        }
        if (prefs.colorMode) {
          setColorModePreferenceState(prefs.colorMode);
        }
      } catch (error) {
        console.warn('[Theme] Failed to load preferences:', error);
      }
      setIsLoaded(true);
    }
    loadPreferences();
  }, []);

  // Handler to update text size and persist
  const setTextSize = async (size: TextSizePreference) => {
    setTextSizeState(size);
    try {
      const { updatePreferences } = await import('../storage/storageService');
      await updatePreferences({ textSize: size });
    } catch (error) {
      console.warn('[Theme] Failed to save text size preference:', error);
    }
  };

  // Handler to update color mode and persist
  const setColorMode = async (mode: ColorModePreference) => {
    setColorModePreferenceState(mode);
    try {
      const { updatePreferences } = await import('../storage/storageService');
      await updatePreferences({ colorMode: mode });
    } catch (error) {
      console.warn('[Theme] Failed to save color mode preference:', error);
    }
  };

  // Build theme based on version, text size, and color mode
  const theme = useMemo<Theme>(() => {
    // Select colors based on version and color mode
    let colors;
    if (ACTIVE_THEME_VERSION === 'v2') {
      colors = colorMode === 'dark' ? colorsV2Dark : colorsV2;
    } else {
      colors = colorMode === 'dark' ? colorsV1Dark : colorsV1;
    }

    // Create typography with colors (for color-dependent styles)
    const typography =
      ACTIVE_THEME_VERSION === 'v2'
        ? createTypographyV2(colors, textSize)
        : createTypographyV1(colors);

    return {
      colors,
      typography,
      spacing,
      layout,
    };
  }, [textSize, colorMode]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      textSize,
      setTextSize,
      colorMode,
      colorModePreference,
      setColorMode,
      themeVersion: ACTIVE_THEME_VERSION,
    }),
    [theme, textSize, colorMode, colorModePreference]
  );

  // Don't render until preferences are loaded to avoid flash
  if (!isLoaded) {
    return null;
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ============================================
// Legacy exports for backward compatibility
// ============================================

// These allow gradual migration - screens can import from either location
// Once all screens use useTheme(), these can be removed

export const colors = colorsV2;
export const typography = createTypographyV2(colorsV2, 'medium');
