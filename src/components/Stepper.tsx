import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { lightTap } from '../utils/haptics';

type StepperProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
};

/**
 * Simple +/- stepper component for numeric values.
 * Matches discrete button pattern used elsewhere in the app.
 * Includes haptic feedback on value change.
 */
export default function Stepper({ value, min, max, onChange, label }: StepperProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const canDecrement = value > min;
  const canIncrement = value < max;

  const handleDecrement = () => {
    if (canDecrement) {
      lightTap();
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      lightTap();
      onChange(value + 1);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.controls}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            !canDecrement && styles.buttonDisabled,
            pressed && canDecrement && styles.buttonPressed,
          ]}
          onPress={handleDecrement}
          disabled={!canDecrement}
          hitSlop={8}
          accessibilityLabel="Decrease"
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, !canDecrement && styles.buttonTextDisabled]}>-</Text>
        </Pressable>

        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !canIncrement && styles.buttonDisabled,
            pressed && canIncrement && styles.buttonPressed,
          ]}
          onPress={handleIncrement}
          disabled={!canIncrement}
          hitSlop={8}
          accessibilityLabel="Increase"
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, !canIncrement && styles.buttonTextDisabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    label: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSecondary,
      marginRight: spacing.md,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    button: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    buttonPressed: {
      opacity: 0.6,
      backgroundColor: colors.dividerSubtle,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: '400',
      color: colors.textPrimary,
      lineHeight: 20,
    },
    buttonTextDisabled: {
      color: colors.textSubtle,
    },
    valueContainer: {
      minWidth: 40,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    value: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });
}
