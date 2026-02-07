import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme/types';

type DataPoint = {
  label: string;
  value: number;
};

type Props = {
  data: DataPoint[];
  height?: number;
  showLabels?: boolean;
};

/**
 * Simple vertical bar chart using react-native-svg.
 * Uses neutral single color (accent), no axis lines, minimal labels.
 */
export default function BarChart({ data, height = 120, showLabels = true }: Props) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Find max value for scaling
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  // Calculate bar dimensions
  const barCount = data.length;
  const chartWidth = '100%';
  const barGap = Math.min(4, 48 / barCount); // Smaller gaps for more bars
  const labelHeight = showLabels ? 20 : 0;
  const chartHeight = height - labelHeight;

  // Determine which labels to show (skip some for dense data)
  const labelInterval = barCount > 14 ? Math.ceil(barCount / 7) : 1;

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.chartArea}>
        <View style={styles.barsContainer}>
          {data.map((point, index) => {
            const barHeight = (point.value / maxValue) * chartHeight;
            const showThisLabel = showLabels && index % labelInterval === 0;

            return (
              <View key={index} style={styles.barWrapper}>
                <View style={[styles.barContainer, { height: chartHeight }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, point.value > 0 ? 2 : 0),
                        backgroundColor: colors.accent,
                      },
                    ]}
                  />
                </View>
                {showLabels && (
                  <Text
                    style={[styles.label, !showThisLabel && styles.labelHidden]}
                    numberOfLines={1}
                  >
                    {point.label}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      width: '100%',
    },
    chartArea: {
      flex: 1,
    },
    barsContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xs,
    },
    barWrapper: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 1,
    },
    barContainer: {
      width: '100%',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    bar: {
      width: '70%',
      maxWidth: 20,
      borderRadius: 2,
    },
    label: {
      fontSize: 10,
      fontWeight: '400',
      color: colors.textSubtle,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    labelHidden: {
      opacity: 0,
    },
  });
}
