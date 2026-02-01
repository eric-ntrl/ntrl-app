import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme/types';

type Props = {
  value: number | string;
  label: string;
  onPress?: () => void;
};

/**
 * Reusable metric display bucket for stats card.
 * Shows a value and label, optionally tappable.
 */
export default function StatBucket({ value, label, onPress }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const content = (
    <View style={styles.container}>
      <Text style={styles.value}>{value}</Text>
      <Text style={[styles.label, onPress && styles.labelTappable]}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
        accessibilityRole="button"
        accessibilityLabel={`${value} ${label}. Tap for details.`}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      flex: 1,
    },
    value: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    label: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textMuted,
      textAlign: 'center',
    },
    labelTappable: {
      color: colors.textSubtle,
      textDecorationLine: 'underline',
      textDecorationStyle: 'dotted',
    },
    pressed: {
      opacity: 0.6,
    },
  });
}
