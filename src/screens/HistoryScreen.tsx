import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import {
  getHistory,
  clearHistory,
  removeHistoryEntry,
  getWeeklyReadingStats,
} from '../storage/storageService';
import { decodeHtmlEntities } from '../utils/text';
import { formatTimeAgo } from '../utils/dateFormatters';
import { LIMITS } from '../constants';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import SwipeableRow from '../components/SwipeableRow';
import type { HistoryEntry } from '../storage/types';
import type { Item } from '../types';
import type { HistoryScreenProps } from '../navigation/types';

const PAGE_SIZE = LIMITS.PAGE_SIZE;

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
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Text style={styles.backArrow}>‹</Text>
    </Pressable>
  );
}

function ClearButton({
  onPress,
  styles,
}: {
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
      hitSlop={12}
      accessibilityLabel="Clear history"
      accessibilityRole="button"
    >
      <Text style={styles.clearButtonText}>Clear</Text>
    </Pressable>
  );
}

function Header({
  onBack,
  onClear,
  showClear,
  styles,
}: {
  onBack: () => void;
  onClear: () => void;
  showClear: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} styles={styles} />
      <Text style={styles.headerTitle}>HISTORY</Text>
      {showClear ? (
        <ClearButton onPress={onClear} styles={styles} />
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
}

function ArticleCard({
  item,
  viewedAt,
  onPress,
  styles,
}: {
  item: Item;
  viewedAt: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const timeLabel = formatTimeAgo(viewedAt);
  const headline = decodeHtmlEntities(item.headline);
  const summary = decodeHtmlEntities(item.summary);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityLabel={`${headline}. Read ${timeLabel}`}
      accessibilityRole="button"
    >
      <View style={styles.textColumn}>
        <Text style={styles.headline} numberOfLines={3} ellipsizeMode="tail">
          {headline}
        </Text>
        <Text style={styles.summary} numberOfLines={2} ellipsizeMode="tail">
          {summary}
        </Text>
        <Text style={styles.meta}>
          {item.source} · {timeLabel}
        </Text>
      </View>
    </Pressable>
  );
}

function EndOfList({
  readThisWeek,
  styles,
}: {
  readThisWeek: number;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.endOfList}>
      <View style={styles.endDivider} />
      {readThisWeek > 0 && (
        <Text style={styles.endStats}>
          You've read {readThisWeek} {readThisWeek === 1 ? 'article' : 'articles'} this week.
        </Text>
      )}
      <Text style={styles.endMessage}>You're all caught up.</Text>
    </View>
  );
}

/**
 * Displays the user's reading history in a paginated list.
 * - Loads history entries from local storage on focus, with pull-to-refresh
 * - Supports swipe-to-remove and clearing all history
 * - Navigates to ArticleDetail on tap
 */
export default function HistoryScreen({ navigation }: HistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { showToast } = useToast();

  const [allHistory, setAllHistory] = useState<HistoryEntry[]>([]);
  const [displayedCount, setDisplayedCount] = useState<number>(PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [readThisWeek, setReadThisWeek] = useState(0);

  // Displayed history (paginated)
  const displayedHistory = useMemo(
    () => allHistory.slice(0, displayedCount),
    [allHistory, displayedCount]
  );
  const hasMore = displayedCount < allHistory.length;

  const loadHistory = useCallback(async () => {
    const entries = await getHistory();
    setAllHistory(entries);
    const stats = await getWeeklyReadingStats();
    setReadThisWeek(stats.readThisWeek);
  }, []);

  // Load history when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHistory();
      setDisplayedCount(PAGE_SIZE); // Reset pagination on focus
    }, [loadHistory])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setDisplayedCount(PAGE_SIZE); // Reset pagination on refresh
    setRefreshing(false);
  }, [loadHistory]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    // Small delay to show loading indicator
    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + PAGE_SIZE, allHistory.length));
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMore, allHistory.length]);

  const handleRemove = useCallback(
    async (itemId: string) => {
      await removeHistoryEntry(itemId);
      setAllHistory((prev) => prev.filter((h) => h.item.id !== itemId));
      showToast('Removed from history');
    },
    [showToast]
  );

  const handleClear = useCallback(() => {
    Alert.alert('Clear History', 'Are you sure you want to clear your reading history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setAllHistory([]);
          setDisplayedCount(PAGE_SIZE);
          showToast('History cleared');
        },
      },
    ]);
  }, [showToast]);

  const handleNavigateToToday = useCallback(() => {
    // Navigate to Today tab
    navigation.getParent()?.navigate('TodayTab');
  }, [navigation]);

  const renderItem = ({ item, index }: { item: HistoryEntry; index: number }) => (
    <SwipeableRow onDelete={() => handleRemove(item.item.id)}>
      <ArticleCard
        item={item.item}
        viewedAt={item.viewedAt}
        onPress={() => navigation.navigate('ArticleDetail', { item: item.item })}
        styles={styles}
      />
    </SwipeableRow>
  );

  const ListFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.textMuted} />
        </View>
      );
    }
    if (!hasMore && displayedHistory.length > 0) {
      return <EndOfList readThisWeek={readThisWeek} styles={styles} />;
    }
    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Header
        onBack={() => navigation.goBack()}
        onClear={handleClear}
        showClear={allHistory.length > 0}
        styles={styles}
      />

      {allHistory.length === 0 ? (
        <EmptyState
          icon="clock"
          heading="No reading history yet"
          motivation="Articles you read will appear here."
          ctaLabel="Start Reading"
          onCtaPress={handleNavigateToToday}
        />
      ) : (
        <FlatList
          data={displayedHistory}
          keyExtractor={(item, index) => `${item.item.id}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textMuted}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={ListFooter}
        />
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography, spacing, layout } = theme;

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
    headerTitle: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 1.5,
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 40,
    },
    clearButton: {
      height: 40,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearButtonPressed: {
      opacity: 0.5,
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
    },

    // List
    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing.xxxl,
    },

    // Article card
    card: {
      paddingVertical: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
      backgroundColor: colors.background,
    },
    cardPressed: {
      opacity: 0.6,
    },
    textColumn: {
      flex: 1,
    },
    headline: {
      fontSize: typography.headline.fontSize,
      fontWeight: typography.headline.fontWeight,
      lineHeight: typography.headline.lineHeight,
      letterSpacing: typography.headline.letterSpacing,
      color: typography.headline.color,
      marginBottom: spacing.sm,
    },
    summary: {
      fontSize: typography.summary.fontSize,
      fontWeight: typography.summary.fontWeight,
      lineHeight: typography.summary.lineHeight,
      letterSpacing: typography.summary.letterSpacing,
      color: typography.summary.color,
      marginBottom: spacing.md,
    },
    meta: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
    },

    // End of list
    endOfList: {
      alignItems: 'center',
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xxl,
    },
    endDivider: {
      width: 48,
      height: 1,
      backgroundColor: colors.divider,
      marginBottom: spacing.xl,
    },
    endStats: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    endMessage: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSubtle,
    },

    // Loading more
    loadingMore: {
      paddingVertical: spacing.xl,
      alignItems: 'center',
    },
  });
}
