import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchBrief } from '../api';
import { colors, typography, spacing, layout } from '../theme';
import { decodeHtmlEntities } from '../utils/text';
import type { Item, Section, Brief } from '../types';

type Props = { navigation: any };

type Row =
  | { type: 'section'; section: Section }
  | { type: 'item'; item: Item }
  | { type: 'endOfFeed' };

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Filter items to only include those published within the last 24 hours
 */
function filterRecentItems(items: Item[], now: Date): Item[] {
  const cutoff = now.getTime() - TWENTY_FOUR_HOURS_MS;
  return items.filter((item) => {
    // Ensure UTC parsing - API returns UTC timestamps without 'Z' suffix
    const dateString = item.published_at;
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const publishedAt = new Date(utcString).getTime();
    return publishedAt >= cutoff;
  });
}

/**
 * Flatten brief into rows, filtering to 24h window
 */
function flatten(b: Brief, now: Date): Row[] {
  const rows: Row[] = [];

  for (const section of b.sections) {
    const recentItems = filterRecentItems(section.items, now);

    // Only add section if it has recent items
    if (recentItems.length > 0) {
      rows.push({ type: 'section', section: { ...section, items: recentItems } });
      for (const item of recentItems) {
        rows.push({ type: 'item', item });
      }
    }
  }

  rows.push({ type: 'endOfFeed' });
  return rows;
}

/**
 * Format date for header: "Wednesday, January 8"
 */
function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format relative time consistently
 * Only for items within 24h window
 */
function formatRelativeTime(dateString: string, now: Date): string {
  // Ensure UTC parsing - API returns UTC timestamps without 'Z' suffix
  const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(utcString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  // Should not reach here due to 24h filter, but fallback
  return 'Today';
}

function Header({
  date,
  onSearchPress,
  onProfilePress,
}: {
  date: string;
  onSearchPress: () => void;
  onProfilePress: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.brand}>NTRL</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <View style={styles.headerRight}>
        <Pressable
          style={({ pressed }) => [
            styles.headerIcon,
            pressed && styles.headerIconPressed,
          ]}
          onPress={onSearchPress}
          hitSlop={8}
          accessibilityLabel="Search"
          accessibilityRole="button"
        >
          <Text style={styles.headerIconText}>⌕</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.headerIcon,
            pressed && styles.headerIconPressed,
          ]}
          onPress={onProfilePress}
          hitSlop={8}
          accessibilityLabel="Profile"
          accessibilityRole="button"
        >
          <Text style={styles.headerIconText}>○</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
    </View>
  );
}

function ArticleCard({
  item,
  timeLabel,
  onPress,
}: {
  item: Item;
  timeLabel: string;
  onPress: () => void;
}) {
  const headline = decodeHtmlEntities(item.headline);
  const summary = decodeHtmlEntities(item.summary);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.textColumn}>
        <Text style={styles.headline} numberOfLines={2} ellipsizeMode="tail">
          {headline}
        </Text>
        <Text style={styles.summary} numberOfLines={3} ellipsizeMode="tail">
          {summary}
        </Text>
        <Text style={styles.meta}>
          {item.source} · {timeLabel}
        </Text>
      </View>
    </Pressable>
  );
}

function EndOfFeed({
  date,
  onAboutPress,
}: {
  date: string;
  onAboutPress: () => void;
}) {
  return (
    <View style={styles.endOfFeed}>
      <View style={styles.endDivider} />
      <Text style={styles.endMessage}>You're all caught up</Text>
      <Text style={styles.endDate}>Today · {date}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.aboutLink,
          pressed && styles.aboutLinkPressed,
        ]}
        onPress={onAboutPress}
      >
        <Text style={styles.aboutLinkText}>About NTRL</Text>
      </Pressable>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={colors.textMuted} />
      <Text style={styles.loadingText}>Loading your brief...</Text>
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyMessage}>{message}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.retryButton,
          pressed && styles.retryButtonPressed,
        ]}
        onPress={onRetry}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

export default function FeedScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Triggers timestamp recalculation

  const loadBrief = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setRefreshKey((k) => k + 1); // Update timestamps on refresh
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await fetchBrief();
      setBrief(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load brief';
      if (message.includes('No daily brief available')) {
        setError('No stories yet. Check back later.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBrief();
  }, [loadBrief]);

  const onRefresh = useCallback(() => {
    loadBrief(true);
  }, [loadBrief]);

  // Use current time as anchor for all calculations
  // refreshKey dependency ensures timestamps update on pull-to-refresh
  const now = useMemo(() => new Date(), [refreshKey]);
  const headerDate = formatHeaderDate(now);
  const rows = useMemo(() => (brief ? flatten(brief, now) : []), [brief, now]);

  const renderItem = ({ item, index }: { item: Row; index: number }) => {
    if (item.type === 'section') {
      return <SectionHeader title={item.section.title} />;
    }

    if (item.type === 'endOfFeed') {
      return (
        <EndOfFeed
          date={headerDate}
          onAboutPress={() => navigation.navigate('About')}
        />
      );
    }

    const timeLabel = formatRelativeTime(item.item.published_at, now);
    return (
      <ArticleCard
        item={item.item}
        timeLabel={timeLabel}
        onPress={() => navigation.navigate('ArticleDetail', { item: item.item })}
      />
    );
  };

  // Check if feed is empty (no recent items)
  const hasContent = rows.some((r) => r.type === 'item');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Header
        date={headerDate}
        onSearchPress={() => navigation.navigate('Search')}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      {loading && !brief ? (
        <LoadingState />
      ) : error && !brief ? (
        <ErrorState message={error} onRetry={() => loadBrief()} />
      ) : !hasContent ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyMessage}>No new updates right now.</Text>
          <Pressable
            style={({ pressed }) => [
              styles.aboutLink,
              pressed && styles.aboutLinkPressed,
            ]}
            onPress={() => navigation.navigate('About')}
          >
            <Text style={styles.aboutLinkText}>About NTRL</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r, idx) =>
            r.type === 'section'
              ? `section-${r.section.key}`
              : r.type === 'endOfFeed'
              ? 'end-of-feed'
              : `item-${r.item.id}`
          }
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconPressed: {
    opacity: 0.5,
  },
  headerIconText: {
    fontSize: 22,
    color: colors.textMuted,
  },
  brand: {
    ...typography.brand,
    color: colors.textPrimary,
  },
  date: {
    ...typography.date,
    marginTop: spacing.xs,
  },

  // List
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxxl,
  },

  // Section header
  sectionHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: colors.textSubtle,
  },

  // Article card - with text wrapping fixes
  card: {
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    alignSelf: 'stretch',
    width: '100%',
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.6,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  headline: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    flexShrink: 1,
    minWidth: 0,
  },
  summary: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    flexShrink: 1,
    minWidth: 0,
  },
  meta: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
  },

  // End of feed
  endOfFeed: {
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
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  endDate: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSubtle,
    marginBottom: spacing.xl,
  },

  // About link (moved to footer)
  aboutLink: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  aboutLinkPressed: {
    opacity: 0.5,
  },
  aboutLinkText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },

  // Loading state
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textMuted,
    marginTop: spacing.lg,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  emptyMessage: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  // Retry button
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.textPrimary,
    borderRadius: 8,
  },
  retryButtonPressed: {
    opacity: 0.7,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
});
