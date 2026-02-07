import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

type TransparencyDisclaimerProps = {
  /** Which variant of disclaimer to show */
  variant: 'full' | 'ntrl';
  /** Callback when "See transparency view" is tapped (full variant only) */
  onTapLink?: () => void;
};

/**
 * Contextual disclaimer for Full and NTRL article views.
 *
 * - Full: "Neutralised article - manipulative language removed. See transparency view."
 * - NTRL: "Transparency view - shows the original article with removed language highlighted and struck through."
 */
export default function TransparencyDisclaimer({
  variant,
  onTapLink,
}: TransparencyDisclaimerProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (variant === 'full') {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Neutralised article — manipulative language removed.{' '}
          {onTapLink && (
            <Pressable onPress={onTapLink}>
              <Text style={styles.link}>See transparency view.</Text>
            </Pressable>
          )}
        </Text>
      </View>
    );
  }

  // NTRL variant
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Transparency view — shows the original article with removed language highlighted and struck
        through.
      </Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      marginBottom: spacing.lg,
    },
    text: {
      fontSize: 13,
      fontWeight: '400',
      fontStyle: 'italic',
      lineHeight: 18,
      color: colors.textMuted,
    },
    link: {
      fontSize: 13,
      fontWeight: '500',
      fontStyle: 'italic',
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
  });
}
