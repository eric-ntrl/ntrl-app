import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop, ClipPath } from 'react-native-svg';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

type ManipulationGaugeProps = {
  /** Integrity score (0-100, where 100 = no manipulation) */
  score: number;
  /** Phrases per paragraph (e.g., "1.8") */
  phrasesPerParagraph: string;
};

/**
 * Horizontal bar gauge showing content integrity score.
 *
 * Visual design:
 * - Horizontal pill-shaped bar (~280x10px)
 * - Gradient: green (left/100) → yellow → orange → red (right/0)
 * - Fill shows score position (higher score = more green visible)
 * - Score number displayed prominently above bar
 * - Subtext shows phrases per paragraph
 */
export default function ManipulationGauge({
  score,
  phrasesPerParagraph,
}: ManipulationGaugeProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;

  // Clamp score to 0-100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Fill percentage (score of 100 = full bar, score of 0 = empty)
  const fillPercent = clampedScore;

  // Determine label based on score
  const getLabel = () => {
    if (clampedScore >= 90) return 'Clean';
    if (clampedScore >= 75) return 'Mostly clean';
    if (clampedScore >= 60) return 'Some concerns';
    if (clampedScore >= 45) return 'Problematic';
    return 'Highly manipulative';
  };

  // SVG dimensions
  const width = 280;
  const height = 10;
  const borderRadius = 5;

  // Calculate fill width based on score
  const fillWidth = (fillPercent / 100) * width;

  return (
    <View style={styles.container}>
      {/* Score number */}
      <Text style={styles.scoreText}>{clampedScore}</Text>
      <Text style={styles.label}>{getLabel()}</Text>

      {/* Horizontal bar */}
      <View style={styles.barContainer}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            {/* Gradient: red (left/0) → orange → yellow → green (right/100) */}
            <LinearGradient id="integrityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#D32F2F" />
              <Stop offset="30%" stopColor="#FF9800" />
              <Stop offset="60%" stopColor="#FFEB3B" />
              <Stop offset="80%" stopColor="#8BC34A" />
              <Stop offset="100%" stopColor="#4CAF50" />
            </LinearGradient>

            {/* Clip path for rounded rectangle */}
            <ClipPath id="barClip">
              <Rect x={0} y={0} width={width} height={height} rx={borderRadius} ry={borderRadius} />
            </ClipPath>
          </Defs>

          {/* Background bar (subtle) */}
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={borderRadius}
            ry={borderRadius}
            fill={colors.divider}
          />

          {/* Gradient fill - clipped to bar shape */}
          <Rect
            x={0}
            y={0}
            width={fillWidth}
            height={height}
            fill="url(#integrityGradient)"
            clipPath="url(#barClip)"
          />
        </Svg>
      </View>

      {/* Subtext */}
      <Text style={styles.subtext}>
        {phrasesPerParagraph} phrases per paragraph
      </Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    scoreText: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    barContainer: {
      marginVertical: spacing.xs,
    },
    subtext: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
  });
}
