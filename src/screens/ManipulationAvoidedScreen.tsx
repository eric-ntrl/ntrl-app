import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import type { ManipulationAvoidedScreenProps } from '../navigation/types';
import type { StatsTimeRange } from '../storage/types';
import { getStatsBreakdown, type StatsBreakdown } from '../services/statsService';
import { lightTap } from '../utils/haptics';
import { BarChart, CategoryBreakdownList, RangeSwitcher } from '../components/stats';

function BackButton({
  onPress,
  styles,
}: {
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
      hitSlop={12}
    >
      <Text style={styles.backArrow}>‹</Text>
    </Pressable>
  );
}

function Header({
  onBack,
  styles,
}: {
  onBack: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} styles={styles} />
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Phrases Avoided</Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

/**
 * ManipulationAvoidedScreen - Detail screen showing phrases avoided breakdown.
 * Displays time range switcher, bar chart, and category breakdown.
 * No gamification, no urgency, calm factual display.
 */
export default function ManipulationAvoidedScreen({
  navigation,
}: ManipulationAvoidedScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [range, setRange] = useState<StatsTimeRange>('week');
  const [breakdown, setBreakdown] = useState<StatsBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  // Load breakdown data when range changes
  useEffect(() => {
    let cancelled = false;

    async function loadBreakdown() {
      setLoading(true);
      try {
        const data = await getStatsBreakdown(range);
        if (!cancelled) {
          setBreakdown(data);
        }
      } catch (error) {
        console.warn('[ManipulationAvoided] Failed to load breakdown:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBreakdown();

    return () => {
      cancelled = true;
    };
  }, [range]);

  const handleRangeChange = useCallback((newRange: StatsTimeRange) => {
    lightTap();
    setRange(newRange);
  }, []);

  const handleShare = async () => {
    if (!breakdown) return;

    const rangeLabel = {
      day: 'today',
      week: 'this week',
      month: 'this month',
      all: 'all time',
    }[range];

    const message = `I avoided ${breakdown.total} manipulative phrases ${rangeLabel} with NTRL.\n\nNTRL removes clickbait, urgency, and emotional triggers from news so you can read what actually happened.`;

    try {
      await Share.share({ message });
    } catch (error) {
      // User cancelled or share failed
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Header onBack={() => navigation.goBack()} styles={styles} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Range Switcher */}
        <View style={styles.rangeSwitcherContainer}>
          <RangeSwitcher selected={range} onSelect={handleRangeChange} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.textMuted} />
          </View>
        ) : breakdown?.isEmpty ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reading activity in this period.</Text>
          </View>
        ) : breakdown ? (
          <>
            {/* Total Count */}
            <View style={styles.totalSection}>
              <Text style={styles.totalValue}>{breakdown.total}</Text>
              <Text style={styles.totalLabel}>phrases removed from articles you read</Text>
            </View>

            {/* Bar Chart */}
            {breakdown.series.length > 0 && (
              <View style={styles.chartSection}>
                <BarChart
                  data={breakdown.series.map((s) => ({
                    label: s.label,
                    value: s.value,
                  }))}
                  height={140}
                  showLabels={breakdown.series.length <= 31}
                />
              </View>
            )}

            {/* Category Breakdown */}
            {breakdown.categories.length > 0 && (
              <View style={styles.categoriesSection}>
                <Text style={styles.categoriesTitle}>BY CATEGORY</Text>
                <CategoryBreakdownList categories={breakdown.categories} />
              </View>
            )}

            {/* Share Button */}
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Share my stats"
            >
              <Text style={styles.shareButtonText}>Share My Stats</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing, layout } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonPressed: {
      opacity: 0.5,
    },
    backArrow: {
      fontSize: 32,
      fontWeight: '300',
      color: colors.textPrimary,
      marginTop: -4,
    },
    headerCenter: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 40,
    },

    // Content
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxxl,
    },

    // Range Switcher
    rangeSwitcherContainer: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },

    // Loading
    loadingContainer: {
      paddingVertical: spacing.xxxl,
      alignItems: 'center',
    },

    // Empty State
    emptyContainer: {
      paddingVertical: spacing.xxxl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 15,
      fontWeight: '400',
      fontStyle: 'italic',
      color: colors.textSubtle,
      textAlign: 'center',
    },

    // Total Section
    totalSection: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    totalValue: {
      fontSize: 64,
      fontWeight: '700',
      color: colors.textPrimary,
      lineHeight: 72,
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textMuted,
      marginTop: spacing.xs,
      textAlign: 'center',
    },

    // Chart Section
    chartSection: {
      marginBottom: spacing.xxl,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
    },

    // Categories Section
    categoriesSection: {
      marginBottom: spacing.xxl,
    },
    categoriesTitle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      color: colors.textSubtle,
      marginBottom: spacing.sm,
    },

    // Share Button
    shareButton: {
      paddingVertical: spacing.lg,
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.dividerSubtle,
      marginTop: spacing.lg,
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
