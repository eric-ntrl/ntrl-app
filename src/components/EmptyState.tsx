import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

type EmptyStateProps = {
  icon: 'bookmark' | 'clock';
  heading: string;
  motivation: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
};

/**
 * Bookmark outline icon (24x24)
 */
function BookmarkIcon({ color }: { color: string }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Clock outline icon (24x24)
 */
function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 6v6l4 2"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * 3-part empty state component for Saved/History screens.
 * Displays icon, heading, motivation text, and optional CTA button.
 */
export default function EmptyState({
  icon,
  heading,
  motivation,
  ctaLabel,
  onCtaPress,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const IconComponent = icon === 'bookmark' ? BookmarkIcon : ClockIcon;

  return (
    <View style={styles.container}>
      <View
        style={styles.iconContainer}
        accessibilityLabel={icon === 'bookmark' ? 'Bookmark icon' : 'Clock icon'}
      >
        <IconComponent color={colors.textSubtle} />
      </View>

      <Text style={styles.heading}>{heading}</Text>

      <Text style={styles.motivation}>{motivation}</Text>

      {ctaLabel && onCtaPress && (
        <Pressable
          onPress={onCtaPress}
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Text style={styles.ctaLabel}>{ctaLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    iconContainer: {
      marginBottom: spacing.lg,
    },
    heading: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    motivation: {
      fontSize: 15,
      fontWeight: '400',
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    ctaButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    ctaButtonPressed: {
      opacity: 0.7,
    },
    ctaLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.accentSecondary,
    },
  });
}
