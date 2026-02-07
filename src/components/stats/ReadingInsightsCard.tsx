import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme/types';

type ReadingInsightsCardProps = {
  weeklyMinutes: number;
  articlesCompleted: number;
  termsNeutralized: number;
};

/**
 * Reading insights card showing weekly reading stats.
 * Used on ProfileScreen to display gentle analytics.
 */
export default function ReadingInsightsCard({
  weeklyMinutes,
  articlesCompleted,
  termsNeutralized,
}: ReadingInsightsCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isEmpty = weeklyMinutes === 0 && articlesCompleted === 0 && termsNeutralized === 0;

  return (
    <View style={styles.container}>
      {isEmpty ? (
        <Text style={styles.emptyText}>Start reading to see your weekly insights.</Text>
      ) : (
        <>
          <View style={styles.statsRow}>
            <InsightItem value={formatMinutes(weeklyMinutes)} label="this week" styles={styles} />
            <View style={styles.divider} />
            <InsightItem
              value={articlesCompleted.toString()}
              label={articlesCompleted === 1 ? 'article' : 'articles'}
              styles={styles}
            />
            <View style={styles.divider} />
            <InsightItem value={termsNeutralized.toString()} label="neutralized" styles={styles} />
          </View>
          <Text style={styles.supportiveText}>You're staying informed without the noise.</Text>
        </>
      )}
    </View>
  );
}

function InsightItem({
  value,
  label,
  styles,
}: {
  value: string;
  label: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.insightItem}>
      <Text style={styles.insightValue}>{value}</Text>
      <Text style={styles.insightLabel}>{label}</Text>
    </View>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginBottom: spacing.md,
    },
    insightItem: {
      flex: 1,
      alignItems: 'center',
    },
    insightValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    insightLabel: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textMuted,
    },
    divider: {
      width: 1,
      height: 32,
      backgroundColor: colors.dividerSubtle,
    },
    supportiveText: {
      fontSize: 13,
      fontWeight: '400',
      fontStyle: 'italic',
      color: colors.textMuted,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 14,
      fontWeight: '400',
      fontStyle: 'italic',
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
}
