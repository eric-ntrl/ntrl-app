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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { getHistory, clearHistory } from '../storage/storageService';
import { decodeHtmlEntities } from '../utils/text';
import { LIMITS } from '../constants';
import type { HistoryEntry } from '../storage/types';
import type { Item } from '../types';
import type { HistoryScreenProps } from '../navigation/types';

const PAGE_SIZE = LIMITS.PAGE_SIZE;

/**
 * Format relative time for history entries
 */
function formatViewedTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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
      <Text style={styles.headerTitle}>Reading History</Text>
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
  const timeLabel = formatViewedTime(viewedAt);
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

function EmptyState({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>◷</Text>
      <Text style={styles.emptyMessage}>No reading history yet</Text>
      <Text style={styles.emptyHint}>Articles you read will appear here.</Text>
    </View>
  );
}

function EndOfList({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.endOfList}>
      <View style={styles.endDivider} />
      <Text style={styles.endMessage}>End of history</Text>
    </View>
  );
}

export default function HistoryScreen({ navigation }: HistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [allHistory, setAllHistory] = useState<HistoryEntry[]>([]);
  const [displayedCount, setDisplayedCount] = useState<number>(PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Displayed history (paginated)
  const displayedHistory = useMemo(
    () => allHistory.slice(0, displayedCount),
    [allHistory, displayedCount]
  );
  const hasMore = displayedCount < allHistory.length;

  const loadHistory = useCallback(async () => {
    const entries = await getHistory();
    setAllHistory(entries);
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

  const handleClear = useCallback(async () => {
    await clearHistory();
    setAllHistory([]);
    setDisplayedCount(PAGE_SIZE);
  }, []);

  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <ArticleCard
      item={item.item}
      viewedAt={item.viewedAt}
      onPress={() => navigation.navigate('ArticleDetail', { item: item.item })}
      styles={styles}
    />
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
      return <EndOfList styles={styles} />;
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
        <EmptyState styles={styles} />
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
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
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
    },
    cardPressed: {
      opacity: 0.6,
    },
    textColumn: {
      flex: 1,
    },
    headline: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    summary: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 21,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    meta: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
    },

    // Empty state
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: layout.screenPadding,
    },
    emptyIcon: {
      fontSize: 32,
      color: colors.textSubtle,
      marginBottom: spacing.lg,
    },
    emptyMessage: {
      fontSize: 17,
      fontWeight: '500',
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    emptyHint: {
      fontSize: 15,
      fontWeight: '400',
      color: colors.textSubtle,
      textAlign: 'center',
      lineHeight: 22,
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
    endMessage: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textSubtle,
    },

    // Loading more
    loadingMore: {
      paddingVertical: spacing.xl,
      alignItems: 'center',
    },
  });
}
