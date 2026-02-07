import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { lightTap } from '../utils/haptics';
import type { Theme, TextSizePreference } from '../theme/types';

type TextSizePreviewProps = {
  size: TextSizePreference;
  selected: boolean;
  onSelect: () => void;
};

// Font sizes for preview text
const PREVIEW_SIZES: Record<TextSizePreference, number> = {
  small: 14,
  medium: 16,
  large: 18,
  extraLarge: 21,
};

const SIZE_LABELS: Record<TextSizePreference, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  extraLarge: 'Extra Large',
};

/**
 * Text size preview card showing sample text at the selected size.
 * Used in Settings for text size selection.
 */
export default function TextSizePreview({ size, selected, onSelect }: TextSizePreviewProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

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
      accessibilityLabel={`${SIZE_LABELS[size]} text size`}
    >
      <View style={styles.previewContainer}>
        <Text style={[styles.previewText, { fontSize: PREVIEW_SIZES[size] }]} numberOfLines={1}>
          Aa
        </Text>
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]}>{SIZE_LABELS[size]}</Text>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
      minWidth: 70,
    },
    containerSelected: {
      borderColor: colors.accentSecondary,
      backgroundColor: colors.accentSecondarySubtle,
    },
    containerPressed: {
      opacity: 0.8,
    },
    previewContainer: {
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    previewText: {
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Georgia',
    },
    label: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.textMuted,
      textAlign: 'center',
    },
    labelSelected: {
      color: colors.accentSecondary,
      fontWeight: '600',
    },
  });
}
