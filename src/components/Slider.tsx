import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RNSlider from '@react-native-community/slider';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

type SliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  description?: string;
};

/**
 * Styled slider component for story count controls.
 * Shows current value and optional label/description.
 */
export default function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  description,
}: SliderProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      )}

      {description && <Text style={styles.description}>{description}</Text>}

      <View style={styles.sliderContainer}>
        <Text style={styles.rangeLabel}>{min}</Text>
        <RNSlider
          style={styles.slider}
          value={value}
          minimumValue={min}
          maximumValue={max}
          step={step}
          onValueChange={onChange}
          minimumTrackTintColor={colors.accentSecondary}
          maximumTrackTintColor={colors.divider}
          thumbTintColor={colors.accentSecondary}
          accessibilityLabel={label || 'Slider'}
          accessibilityValue={{
            min,
            max,
            now: value,
          }}
        />
        <Text style={styles.rangeLabel}>{max}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      paddingVertical: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    label: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    value: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.accentSecondary,
    },
    description: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
      marginBottom: spacing.md,
    },
    sliderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    slider: {
      flex: 1,
      marginHorizontal: spacing.sm,
    },
    rangeLabel: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textSubtle,
      minWidth: 20,
      textAlign: 'center',
    },
  });
}
