import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

type ProgressBarProps = {
  current: number; // Current item index
  total: number; // Total items
};

/**
 * Thin horizontal bar showing scroll progress through finite list.
 * Used in feed screens to indicate position within a bounded set of articles.
 */
export default function ProgressBar({ current, total }: ProgressBarProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const progress = total > 0 ? Math.min((current + 1) / total, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.fill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    container: {
      height: 3,
      backgroundColor: colors.divider,
      borderRadius: 1.5,
      marginHorizontal: spacing.xl,
      marginVertical: spacing.md,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 1.5,
    },
  });
}
