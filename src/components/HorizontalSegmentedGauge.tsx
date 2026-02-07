import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { getBandForScore, NTRL_INDEX_BANDS } from '../utils/ntrlIndex';

type HorizontalSegmentedGaugeProps = {
  /** NTRL Index score (0-100), determines active segment */
  score: number;
  /** Callback when gauge is tapped - opens detail sheet */
  onPress?: () => void;
};

/**
 * Muted colors for gauge segments (40% opacity versions of band colors).
 * These provide a calm aesthetic with the active segment at full opacity.
 */
const SEGMENT_COLORS = {
  muted: {
    clear: 'rgba(122, 154, 109, 0.25)', // #7A9A6D at ~25%
    low: 'rgba(155, 171, 122, 0.25)', // #9BAB7A at ~25%
    moderate: 'rgba(196, 168, 85, 0.25)', // #C4A855 at ~25%
    high: 'rgba(184, 120, 74, 0.25)', // #B8784A at ~25%
    severe: 'rgba(155, 69, 69, 0.25)', // #9B4545 at ~25%
  },
  active: {
    clear: '#7A9A6D',
    low: '#9BAB7A',
    moderate: '#C4A855',
    high: '#B8784A',
    severe: '#9B4545',
  },
};

/**
 * Segment index for each band (0-4).
 */
function getSegmentIndex(score: number): number {
  if (score <= 0) return 0; // Clean
  if (score <= 15) return 1; // Low
  if (score <= 35) return 2; // Moderate
  if (score <= 60) return 3; // High
  return 4; // Severe
}

/**
 * HorizontalSegmentedGauge - 5 horizontal segments showing manipulation level.
 *
 * Replaces the semi-circular NtrlIndexGauge with a simpler, calmer design.
 * Shows index word (Clear/Low/Moderate/High/Severe) centered above bar.
 * NO numeric score displayed.
 */
export default function HorizontalSegmentedGauge({
  score,
  onPress,
}: HorizontalSegmentedGaugeProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const clampedScore = Math.max(0, Math.min(100, score));
  const band = getBandForScore(clampedScore);
  const activeIndex = getSegmentIndex(clampedScore);

  // Segment keys in order
  const segmentKeys: Array<keyof typeof SEGMENT_COLORS.active> = [
    'clear',
    'low',
    'moderate',
    'high',
    'severe',
  ];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      accessibilityRole="button"
      accessibilityLabel={`NTRL Index: ${band.label}. Tap for details.`}
    >
      {/* Index word label */}
      <Text style={[styles.labelText, { color: band.color }]}>{band.label}</Text>

      {/* Segmented bar */}
      <View style={styles.barContainer}>
        {segmentKeys.map((key, index) => {
          const isActive = index === activeIndex;
          const backgroundColor = isActive ? SEGMENT_COLORS.active[key] : SEGMENT_COLORS.muted[key];

          return (
            <View
              key={key}
              style={[
                styles.segment,
                { backgroundColor },
                index === 0 && styles.segmentFirst,
                index === segmentKeys.length - 1 && styles.segmentLast,
              ]}
            />
          );
        })}
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
      paddingVertical: spacing.lg,
    },
    containerPressed: {
      opacity: 0.7,
    },
    labelText: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: spacing.md,
    },
    barContainer: {
      flexDirection: 'row',
      width: 260,
      height: 12,
      gap: 2,
    },
    segment: {
      flex: 1,
      height: '100%',
    },
    segmentFirst: {
      borderTopLeftRadius: 6,
      borderBottomLeftRadius: 6,
    },
    segmentLast: {
      borderTopRightRadius: 6,
      borderBottomRightRadius: 6,
    },
    hintText: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textMuted,
      marginTop: spacing.sm,
    },
  });
}
