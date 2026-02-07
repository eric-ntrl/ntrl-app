import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import {
  getSavedArticles,
  removeSavedArticle,
  clearAllSavedArticles,
  getWeeklyReadingStats,
} from '../storage/storageService';
import { decodeHtmlEntities } from '../utils/text';
import { formatTimeAgo } from '../utils/dateFormatters';
import { LIMITS } from '../constants';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import SwipeableRow from '../components/SwipeableRow';
import type { SavedArticle } from '../storage/types';
import type { Item } from '../types';
import type { SavedArticlesScreenProps } from '../navigation/types';

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

function ClearAllButton({
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
      accessibilityLabel="Clear all saved articles"
      accessibilityRole="button"
    >
      <Text style={styles.clearButtonText}>Clear all</Text>
    </Pressable>
  );
}

function Header({
  onBack,
  onClearAll,
  showClear,
  styles,
}: {
  onBack: () => void;
  onClearAll: () => void;
  showClear: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} styles={styles} />
      <Text style={styles.headerTitle}>SAVED</Text>
      {showClear ? (
        <ClearAllButton onPress={onClearAll} styles={styles} />
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
}

function ArticleCard({
  item,
  savedAt,
  onPress,
  styles,
}: {
  item: Item;
  savedAt: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const timeLabel = formatTimeAgo(savedAt);
  const headline = decodeHtmlEntities(item.headline);
  const summary = decodeHtmlEntities(item.summary);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityLabel={`${headline}. Saved ${timeLabel}.`}
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
          {item.source} · Saved {timeLabel}
        </Text>
      </View>
    </Pressable>
  );
}

function EndOfList({
  savedThisWeek,
  styles,
}: {
  savedThisWeek: number;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.endOfList}>
      <View style={styles.endDivider} />
      {savedThisWeek > 0 && (
        <Text style={styles.endStats}>
          You've saved {savedThisWeek} {savedThisWeek === 1 ? 'article' : 'articles'} this week.
        </Text>
      )}
      <Text style={styles.endMessage}>You're all caught up.</Text>
    </View>
  );
}

/**
 * Displays the user's saved articles in a paginated list.
 * - Loads saved articles from local storage on focus, with pull-to-refresh
 * - Supports swipe-to-remove for saved articles
 * - Navigates to ArticleDetail on tap
 */
export default function SavedArticlesScreen({ navigation }: SavedArticlesScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { showToast } = useToast();

  const [allArticles, setAllArticles] = useState<SavedArticle[]>([]);
  const [displayedCount, setDisplayedCount] = useState<number>(PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savedThisWeek, setSavedThisWeek] = useState(0);

  // Displayed articles (paginated)
  const displayedArticles = useMemo(
    () => allArticles.slice(0, displayedCount),
    [allArticles, displayedCount]
  );
  const hasMore = displayedCount < allArticles.length;

  const loadSavedArticles = useCallback(async () => {
    const articles = await getSavedArticles();
    setAllArticles(articles);
    const stats = await getWeeklyReadingStats();
    setSavedThisWeek(stats.savedThisWeek);
  }, []);

  // Load saved articles when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSavedArticles();
      setDisplayedCount(PAGE_SIZE); // Reset pagination on focus
    }, [loadSavedArticles])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSavedArticles();
    setDisplayedCount(PAGE_SIZE); // Reset pagination on refresh
    setRefreshing(false);
  }, [loadSavedArticles]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    // Small delay to show loading indicator
    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + PAGE_SIZE, allArticles.length));
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMore, allArticles.length]);

  const handleRemove = useCallback(
    async (itemId: string) => {
      // Store the removed article for undo
      const removedArticle = allArticles.find((s) => s.item.id === itemId);

      await removeSavedArticle(itemId);
      setAllArticles((prev) => prev.filter((s) => s.item.id !== itemId));

      showToast('Removed from Saved', {
        action: removedArticle
          ? {
              label: 'Undo',
              onPress: async () => {
                // Re-add the article
                const { saveArticle } = await import('../storage/storageService');
                await saveArticle(removedArticle.item);
                await loadSavedArticles();
              },
            }
          : undefined,
      });
    },
    [allArticles, showToast, loadSavedArticles]
  );

  const handleClearAll = useCallback(() => {
    Alert.alert('Clear All Saved', 'Are you sure you want to remove all saved articles?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await clearAllSavedArticles();
          setAllArticles([]);
          showToast('All saved articles cleared');
        },
      },
    ]);
  }, [showToast]);

  const handleNavigateToToday = useCallback(() => {
    // Navigate to Today tab
    navigation.getParent()?.navigate('TodayTab');
  }, [navigation]);

  const renderItem = ({ item }: { item: SavedArticle }) => (
    <SwipeableRow onDelete={() => handleRemove(item.item.id)}>
      <ArticleCard
        item={item.item}
        savedAt={item.savedAt}
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
    if (!hasMore && displayedArticles.length > 0) {
      return <EndOfList savedThisWeek={savedThisWeek} styles={styles} />;
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
        onClearAll={handleClearAll}
        showClear={allArticles.length > 0}
        styles={styles}
      />

      {allArticles.length === 0 ? (
        <EmptyState
          icon="bookmark"
          heading="No saved articles yet"
          motivation="Save articles to read later when you have more time."
          ctaLabel="Browse Today's News"
          onCtaPress={handleNavigateToToday}
        />
      ) : (
        <FlatList
          data={displayedArticles}
          keyExtractor={(item) => item.item.id}
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
      width: 60,
    },
    clearButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
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
