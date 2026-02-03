import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme/types';

type PublisherCardProps = {
  slug: string;
  name: string;
  count: number;
  onPress: () => void;
};

/**
 * Card for a matching publisher in search results.
 * Shows publisher name and article count.
 */
export default function PublisherCard({ slug, name, count, onPress }: PublisherCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Get first letter for avatar
  const initial = name.charAt(0).toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityLabel={`${name}, ${count} articles`}
      accessibilityRole="button"
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{name}</Text>
        <Text style={styles.sublabel}>Publisher</Text>
      </View>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    cardPressed: {
      backgroundColor: colors.dividerSubtle,
    },
    avatarContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accentSecondarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    avatarText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    sublabel: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textMuted,
      marginTop: 2,
    },
    countBadge: {
      backgroundColor: colors.accentSecondarySubtle,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 10,
    },
    countText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
}
