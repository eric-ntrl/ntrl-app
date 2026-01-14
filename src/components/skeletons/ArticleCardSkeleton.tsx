/**
 * Skeleton loading placeholder for article cards.
 * Displays animated placeholder content while articles are loading.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme/types';

type Props = {
  /**
   * If true, shows 3 skeleton lines for summary (for full card).
   * If false, shows 2 lines (for compact display).
   */
  compact?: boolean;
};

/**
 * Animated skeleton placeholder for article cards.
 *
 * @example
 * ```tsx
 * // Full card skeleton
 * <ArticleCardSkeleton />
 *
 * // Compact skeleton (fewer summary lines)
 * <ArticleCardSkeleton compact />
 * ```
 */
export default function ArticleCardSkeleton({ compact = false }: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <View style={styles.card}>
      {/* Headline - 2 lines */}
      <Animated.View style={[styles.skeletonLine, styles.headline, { opacity }]} />
      <Animated.View style={[styles.skeletonLine, styles.headlineShort, { opacity }]} />

      {/* Summary - 2-3 lines */}
      <Animated.View style={[styles.skeletonLine, styles.summary, { opacity }]} />
      <Animated.View style={[styles.skeletonLine, styles.summary, { opacity }]} />
      {!compact && <Animated.View style={[styles.skeletonLine, styles.summaryShort, { opacity }]} />}

      {/* Meta line */}
      <Animated.View style={[styles.skeletonLine, styles.meta, { opacity }]} />
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    card: {
      paddingVertical: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    skeletonLine: {
      backgroundColor: colors.textMuted,
      borderRadius: 4,
      marginBottom: spacing.sm,
    },
    headline: {
      height: 20,
      width: '100%',
    },
    headlineShort: {
      height: 20,
      width: '75%',
      marginBottom: spacing.md,
    },
    summary: {
      height: 16,
      width: '100%',
    },
    summaryShort: {
      height: 16,
      width: '60%',
      marginBottom: spacing.md,
    },
    meta: {
      height: 12,
      width: '35%',
      marginTop: spacing.xs,
      marginBottom: 0,
    },
  });
}
