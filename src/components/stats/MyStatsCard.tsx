import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Share } from 'react-native';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme/types';
import StatBucket from './StatBucket';

type Props = {
  ntrlDays: number;
  totalSessions: number;
  ntrlMinutes: number;
  phrasesAvoided: number;
  onPhrasesPress?: () => void;
  onSharePress?: () => void;
};

/**
 * My Stats card for ProfileScreen.
 * Shows hero "NTRL Days" number and grid of stats.
 * No gamification, no urgency, calm factual display.
 */
export default function MyStatsCard({
  ntrlDays,
  totalSessions,
  ntrlMinutes,
  phrasesAvoided,
  onPhrasesPress,
  onSharePress,
}: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isEmpty = totalSessions === 0;

  return (
    <View style={styles.container}>
      {/* Hero: NTRL Days */}
      <View style={styles.heroSection}>
        <Text style={styles.heroValue}>{ntrlDays}</Text>
        <Text style={styles.heroLabel}>NTRL Days</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatBucket value={totalSessions} label="Sessions" />
        <View style={styles.divider} />
        <StatBucket value={ntrlMinutes} label="NTRL Minutes" />
        <View style={styles.divider} />
        <StatBucket value={phrasesAvoided} label="Phrases Avoided" onPress={onPhrasesPress} />
      </View>

      {/* Empty state hint */}
      {isEmpty && <Text style={styles.emptyHint}>Start reading to see your stats.</Text>}

      {/* Share button */}
      {!isEmpty && onSharePress && (
        <Pressable
          onPress={onSharePress}
          style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Share my stats"
        >
          <Text style={styles.shareButtonText}>Share My Stats</Text>
        </Pressable>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing, layout } = theme;

  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: layout.cardPadding,
    },
    heroSection: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.dividerSubtle,
      marginBottom: spacing.md,
    },
    heroValue: {
      fontSize: 48,
      fontWeight: '700',
      color: colors.textPrimary,
      lineHeight: 56,
    },
    heroLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
      marginTop: spacing.xs,
      letterSpacing: 0.5,
    },
    statsGrid: {
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'space-between',
    },
    divider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: colors.dividerSubtle,
      marginVertical: spacing.sm,
    },
    emptyHint: {
      fontSize: 13,
      fontWeight: '400',
      fontStyle: 'italic',
      color: colors.textSubtle,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
    shareButton: {
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.dividerSubtle,
    },
    shareButtonPressed: {
      opacity: 0.5,
    },
    shareButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
    },
  });
}
