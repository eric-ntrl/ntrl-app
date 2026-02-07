import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { lightTap } from '../utils/haptics';
import type { Theme, ColorMode } from '../theme/types';

type ThemePreviewCardProps = {
  mode: ColorMode;
  selected: boolean;
  onSelect: () => void;
};

// Preview colors for each theme mode
const PREVIEW_COLORS: Record<ColorMode, { bg: string; surface: string; text: string }> = {
  light: {
    bg: '#FAF9F6',
    surface: '#FFFFFF',
    text: '#2D2D2D',
  },
  dark: {
    bg: '#1A1816',
    surface: '#262220',
    text: '#F0EBE3',
  },
  sepia: {
    bg: '#F5EFE6',
    surface: '#FBF8F3',
    text: '#3D3225',
  },
};

const MODE_LABELS: Record<ColorMode, string> = {
  light: 'Light',
  dark: 'Dark',
  sepia: 'Sepia',
};

/**
 * Theme preview card showing a mini mockup of the theme.
 * Used in Settings for appearance selection.
 */
export default function ThemePreviewCard({ mode, selected, onSelect }: ThemePreviewCardProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const preview = PREVIEW_COLORS[mode];

  const handlePress = () => {
    lightTap();
    onSelect();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && styles.containerPressed,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${MODE_LABELS[mode]} theme`}
    >
      {/* Mini preview mockup */}
      <View style={[styles.preview, { backgroundColor: preview.bg }]}>
        {/* Mini card */}
        <View style={[styles.miniCard, { backgroundColor: preview.surface }]}>
          <View style={[styles.miniLine, { backgroundColor: preview.text }]} />
          <View style={[styles.miniLineShort, { backgroundColor: preview.text, opacity: 0.5 }]} />
        </View>
        {/* Mini card 2 */}
        <View style={[styles.miniCard, { backgroundColor: preview.surface }]}>
          <View style={[styles.miniLine, { backgroundColor: preview.text }]} />
          <View style={[styles.miniLineShort, { backgroundColor: preview.text, opacity: 0.5 }]} />
        </View>
      </View>

      {/* Label */}
      <Text style={[styles.label, selected && styles.labelSelected]}>{MODE_LABELS[mode]}</Text>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: spacing.sm,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    containerSelected: {
      borderColor: colors.accentSecondary,
      backgroundColor: colors.accentSecondarySubtle,
    },
    containerPressed: {
      opacity: 0.8,
    },
    preview: {
      width: 72,
      height: 80,
      borderRadius: 8,
      padding: 6,
      marginBottom: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    miniCard: {
      padding: 4,
      borderRadius: 3,
      marginBottom: 4,
    },
    miniLine: {
      height: 3,
      borderRadius: 1.5,
      width: '80%',
      marginBottom: 2,
    },
    miniLineShort: {
      height: 2,
      borderRadius: 1,
      width: '60%',
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
    },
    labelSelected: {
      color: colors.accentSecondary,
      fontWeight: '600',
    },
  });
}
