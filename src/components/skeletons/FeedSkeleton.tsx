/**
 * Skeleton loading placeholder for the feed screen.
 * Shows section headers and multiple article card placeholders.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme/types';
import ArticleCardSkeleton from './ArticleCardSkeleton';

type Props = {
  /** Number of sections to display (default: 2) */
  sections?: number;
  /** Number of articles per section (default: 3) */
  articlesPerSection?: number;
};

/**
 * Full feed skeleton with section headers and article cards.
 *
 * @example
 * ```tsx
 * // Default: 2 sections, 3 articles each
 * <FeedSkeleton />
 *
 * // Custom: 3 sections, 2 articles each
 * <FeedSkeleton sections={3} articlesPerSection={2} />
 * ```
 */
export default function FeedSkeleton({
  sections = 2,
  articlesPerSection = 3,
}: Props) {
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
    <View style={styles.container}>
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <View key={sectionIndex}>
          {/* Section header skeleton */}
          <View style={styles.sectionHeader}>
            <Animated.View style={[styles.sectionTitle, { opacity }]} />
          </View>

          {/* Article card skeletons */}
          {Array.from({ length: articlesPerSection }).map((_, articleIndex) => (
            <ArticleCardSkeleton
              key={articleIndex}
              compact={articleIndex === articlesPerSection - 1}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing, layout } = theme;

  return StyleSheet.create({
    container: {
      paddingHorizontal: layout.screenPadding,
    },
    sectionHeader: {
      marginTop: 28,
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      height: 12,
      width: 80,
      backgroundColor: colors.textMuted,
      borderRadius: 4,
    },
  });
}
