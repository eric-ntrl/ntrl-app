import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme/types';

// Section display configuration
const SECTION_DISPLAY: Record<string, { label: string; icon: string }> = {
  world: { label: 'World', icon: '🌍' },
  us: { label: 'U.S.', icon: '🇺🇸' },
  local: { label: 'Local', icon: '📍' },
  business: { label: 'Business', icon: '💼' },
  technology: { label: 'Technology', icon: '💻' },
  science: { label: 'Science', icon: '🔬' },
  health: { label: 'Health', icon: '🏥' },
  environment: { label: 'Environment', icon: '🌱' },
  sports: { label: 'Sports', icon: '⚽' },
  culture: { label: 'Culture', icon: '🎭' },
};

type SectionCardProps = {
  sectionKey: string;
  count: number;
  onPress: () => void;
};

/**
 * Card for a matching section in search results.
 * Shows section name and article count.
 */
export default function SectionCard({ sectionKey, count, onPress }: SectionCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const display = SECTION_DISPLAY[sectionKey] || { label: sectionKey, icon: '📰' };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityLabel={`${display.label} section, ${count} articles`}
      accessibilityRole="button"
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{display.icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{display.label}</Text>
        <Text style={styles.sublabel}>Section</Text>
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
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    icon: {
      fontSize: 20,
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
