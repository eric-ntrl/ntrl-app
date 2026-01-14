/**
 * NTRL Design System - Legacy Exports
 *
 * This file provides backward compatibility during migration.
 * Import from './theme' (the directory) for new code.
 *
 * Visual target: "A calm sunny morning with blue skies and coffee"
 */

// Re-export everything from the new theme system
export { colors, typography, spacing, layout, useTheme, ThemeProvider } from './theme/index';
export type { Theme, ThemeVersion, TextSizePreference } from './theme/types';
