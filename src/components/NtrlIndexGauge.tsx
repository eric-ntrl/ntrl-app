import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop, ClipPath, Circle } from 'react-native-svg';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { getBandForScore } from '../utils/ntrlIndex';

type NtrlIndexGaugeProps = {
  /** NTRL Index score (0-100, where 0 = clean, 100 = heavily polluted) */
  score: number;
  /** Callback when gauge is tapped */
  onPress?: () => void;
};

/**
 * NTRL Index Gauge - AQI-inspired manipulation density indicator.
 *
 * Visual design:
 * - Large score number with colored label
 * - Horizontal pill-shaped gradient bar with pessimistic distribution
 * - Score indicator dot positioned on gradient
 * - "Tap for details" hint text
 */
export default function NtrlIndexGauge({ score, onPress }: NtrlIndexGaugeProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;

  // Clamp score to 0-100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Get band for current score
  const band = getBandForScore(clampedScore);

  // SVG dimensions
  const width = 280;
  const height = 12;
  const borderRadius = 6;

  // Calculate indicator position (score percentage along the bar)
  const indicatorX = (clampedScore / 100) * width;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      accessibilityRole="button"
      accessibilityLabel={`NTRL Index: ${clampedScore}, ${band.label}. Tap for details.`}
    >
      {/* Score number and label */}
      <View style={styles.scoreRow}>
        <Text style={styles.scoreText}>{clampedScore}</Text>
        <Text style={[styles.labelText, { color: band.color }]}>{band.label}</Text>
      </View>

      {/* Horizontal gradient bar with indicator */}
      <View style={styles.barContainer}>
        <Svg width={width} height={height + 8} viewBox={`0 0 ${width} ${height + 8}`}>
          <Defs>
            {/* Pessimistic gradient: green (0%) -> yellow (25%) -> orange (50%) -> purple (75%) -> red (100%) */}
            <LinearGradient id="ntrlIndexGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#4CAF50" />
              <Stop offset="10%" stopColor="#8BC34A" />
              <Stop offset="25%" stopColor="#FFEB3B" />
              <Stop offset="50%" stopColor="#FF9800" />
              <Stop offset="75%" stopColor="#9C27B0" />
              <Stop offset="100%" stopColor="#D32F2F" />
            </LinearGradient>

            {/* Clip path for rounded rectangle */}
            <ClipPath id="barClip">
              <Rect x={0} y={4} width={width} height={height} rx={borderRadius} ry={borderRadius} />
            </ClipPath>
          </Defs>

          {/* Gradient bar */}
          <Rect
            x={0}
            y={4}
            width={width}
            height={height}
            rx={borderRadius}
            ry={borderRadius}
            fill="url(#ntrlIndexGradient)"
          />

          {/* Score indicator dot */}
          <Circle
            cx={Math.max(6, Math.min(width - 6, indicatorX))}
            cy={4 + height / 2}
            r={8}
            fill={colors.surface}
            stroke={colors.textPrimary}
            strokeWidth={2}
          />
        </Svg>
      </View>

      {/* Tap hint */}
      <Text style={styles.hintText}>Tap for details</Text>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    containerPressed: {
      opacity: 0.7,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    scoreText: {
      fontSize: 36,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    labelText: {
      fontSize: 16,
      fontWeight: '600',
    },
    barContainer: {
      marginVertical: spacing.xs,
    },
    hintText: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
  });
}
