import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

type ManipulationGaugeProps = {
  /** Manipulation percentage (0-100) */
  percent: number;
  /** Number of flagged phrases */
  spanCount: number;
  /** Total word count in article */
  wordCount: number;
};

/**
 * Semi-circular gauge showing manipulation density.
 *
 * Visual design:
 * - Arc gradient: green (low) → yellow (moderate) → red (high)
 * - Needle indicator pointing to current score
 * - Score capped at 50% for full red (anything above is "heavy manipulation")
 * - Muted colors to maintain calm aesthetic
 */
export default function ManipulationGauge({
  percent,
  spanCount,
  wordCount,
}: ManipulationGaugeProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;

  // Clamp percent: 0-50 range for visual (50%+ is all "heavy")
  const clampedPercent = Math.min(Math.max(percent, 0), 50);

  // Convert to needle angle: -90° (left, 0%) to 90° (right, 50%)
  const needleAngle = (clampedPercent / 50) * 180 - 90;

  // Determine label based on percentage
  const getLabel = () => {
    if (percent < 5) return 'Minimal';
    if (percent < 15) return 'Low';
    if (percent < 30) return 'Moderate';
    return 'High';
  };

  // SVG dimensions
  const width = 140;
  const height = 80;
  const centerX = width / 2;
  const centerY = 70;
  const radius = 55;
  const strokeWidth = 8;

  // Arc path: semi-circle from left to right
  // M = move to start point, A = arc
  const arcPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {/* Gradient: green → yellow → red */}
          <LinearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#7CB342" stopOpacity="0.8" />
            <Stop offset="35%" stopColor="#C0CA33" stopOpacity="0.8" />
            <Stop offset="60%" stopColor="#FFB300" stopOpacity="0.8" />
            <Stop offset="80%" stopColor="#FB8C00" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#E64A19" stopOpacity="0.8" />
          </LinearGradient>
        </Defs>

        {/* Background arc (subtle) */}
        <Path
          d={arcPath}
          stroke={colors.divider}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />

        {/* Gradient arc */}
        <Path
          d={arcPath}
          stroke="url(#arcGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />

        {/* Needle group - rotates around center point */}
        <G rotation={needleAngle} origin={`${centerX}, ${centerY}`}>
          {/* Needle line */}
          <Line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY - radius + 15}
            stroke={colors.textPrimary}
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* Center dot */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={4}
            fill={colors.textPrimary}
          />
        </G>
      </Svg>

      {/* Labels below gauge */}
      <Text style={styles.label}>{getLabel()} manipulation</Text>
      <Text style={styles.subtext}>
        {spanCount} phrase{spanCount !== 1 ? 's' : ''} in {wordCount} words
      </Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: spacing.xs,
    },
    subtext: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textMuted,
      marginTop: 2,
    },
  });
}
