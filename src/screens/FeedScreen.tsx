import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { FeedSkeleton } from '../components/skeletons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchBriefWithCache } from '../api';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { decodeHtmlEntities } from '../utils/text';
import type { Item, Section, Brief } from '../types';
import type { FeedScreenProps } from '../navigation/types';

type Row =
  | { type: 'section'; section: Section }
  | { type: 'item'; item: Item }
  | { type: 'endOfFeed' };

/**
 * Flatten brief into rows for FlatList rendering.
 * Note: 24h filtering is now done server-side via ?hours=24 parameter.
 */
function flatten(b: Brief): Row[] {
  const rows: Row[] = [];

  for (const section of b.sections) {
    // Only add section if it has items
    if (section.items.length > 0) {
      rows.push({ type: 'section', section });
      for (const item of section.items) {
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
  styles,
  colors,
}: {
  date: string;
  onSearchPress: () => void;
  onProfilePress: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: Theme['colors'];
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.brand}>NTRL</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <View style={styles.headerRight}>
        <Pressable
          style={({ pressed }) => [styles.headerIcon, pressed && styles.headerIconPressed]}
          onPress={onSearchPress}
          hitSlop={8}
          accessibilityLabel="Search"
          accessibilityRole="button"
        >
          <Text style={styles.headerIconText}>⌕</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.headerIcon, pressed && styles.headerIconPressed]}
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

function SectionHeader({
  title,
  styles,
}: {
  title: string;
  styles: ReturnType<typeof createStyles>;
}) {
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
  styles,
}: {
  item: Item;
  timeLabel: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const headline = decodeHtmlEntities(item.headline);
  const summary = decodeHtmlEntities(item.summary);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.textColumn}>
        <Text style={styles.articleText} numberOfLines={5} ellipsizeMode="tail">
          <Text style={styles.headline}>{headline}</Text>
          {'  '}
          <Text style={styles.summary}>{summary}</Text>
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
  styles,
}: {
  date: string;
  onAboutPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.endOfFeed}>
      <View style={styles.endDivider} />
      <Text style={styles.endMessage}>You're all caught up</Text>
      <Text style={styles.endDate}>Today · {date}</Text>
      <Pressable
        style={({ pressed }) => [styles.aboutLink, pressed && styles.aboutLinkPressed]}
        onPress={onAboutPress}
      >
        <Text style={styles.aboutLinkText}>About NTRL</Text>
      </Pressable>
    </View>
  );
}

function LoadingState({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <ScrollView style={styles.loadingContainer} showsVerticalScrollIndicator={false}>
      <FeedSkeleton sections={2} articlesPerSection={3} />
    </ScrollView>
  );
}

function ErrorState({
  message,
  onRetry,
  styles,
}: {
  message: string;
  onRetry: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyMessage}>{message}</Text>
      <Pressable
        style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
        onPress={onRetry}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

export default function FeedScreen({ navigation }: FeedScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors, typography, spacing, layout } = theme;

  // Memoize styles to avoid recreation on every render
  const styles = useMemo(() => createStyles(theme), [theme]);

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

      const result = await fetchBriefWithCache();
      setBrief(result.brief);
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
  // Note: 24h filtering is now done server-side via ?hours=24 parameter
  const rows = useMemo(() => (brief ? flatten(brief) : []), [brief]);

  const renderItem = ({ item, index }: { item: Row; index: number }) => {
    if (item.type === 'section') {
      return <SectionHeader title={item.section.title} styles={styles} />;
    }

    if (item.type === 'endOfFeed') {
      return (
        <EndOfFeed
          date={headerDate}
          onAboutPress={() => navigation.navigate('About')}
          styles={styles}
        />
      );
    }

    const timeLabel = formatRelativeTime(item.item.published_at, now);
    return (
      <ArticleCard
        item={item.item}
        timeLabel={timeLabel}
        onPress={() => navigation.navigate('ArticleDetail', { item: item.item })}
        styles={styles}
      />
    );
  };

  // Check if feed is empty (no recent items)
  const hasContent = rows.some((r) => r.type === 'item');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Header
        date={headerDate}
        onSearchPress={() => navigation.navigate('Search')}
        onProfilePress={() => navigation.navigate('Profile')}
        styles={styles}
        colors={colors}
      />

      {loading && !brief ? (
        <LoadingState styles={styles} />
      ) : error && !brief ? (
        <ErrorState message={error} onRetry={() => loadBrief()} styles={styles} />
      ) : !hasContent ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyMessage}>No new updates right now.</Text>
          <Pressable
            style={({ pressed }) => [styles.aboutLink, pressed && styles.aboutLinkPressed]}
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

// Dynamic styles factory - uses theme values
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
      fontSize: typography.brand.fontSize,
      fontWeight: typography.brand.fontWeight,
      letterSpacing: typography.brand.letterSpacing,
      color: colors.textPrimary,
    },
    date: {
      fontSize: typography.date.fontSize,
      fontWeight: typography.date.fontWeight,
      color: typography.date.color,
      marginTop: spacing.xs,
    },

    // List
    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing.xxxl,
    },

    // Section header - refined with more breathing room
    sectionHeader: {
      marginTop: 28, // Increased from 24
      marginBottom: spacing.lg, // Increased from md
    },
    sectionTitle: {
      fontSize: typography.sectionHeader.fontSize,
      fontWeight: typography.sectionHeader.fontWeight,
      letterSpacing: typography.sectionHeader.letterSpacing,
      color: typography.sectionHeader.color,
    },

    // Article card - with text wrapping fixes
    card: {
      paddingTop: spacing.lg,
      paddingBottom: 26, // +10px for editorial rhythm between items
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
    // Container for inline headline + summary text
    articleText: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: -0.2,
      marginBottom: spacing.md,
    },
    // Headline: bold, primary color (flows inline with summary)
    headline: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 26, // +8% for subtle title dominance
      letterSpacing: -0.2,
      color: colors.textPrimary,
    },
    // Summary: regular weight, secondary color (continues inline after headline)
    summary: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      letterSpacing: -0.2,
      color: colors.textSecondary,
    },
    meta: {
      fontSize: typography.meta.fontSize,
      fontWeight: typography.meta.fontWeight,
      letterSpacing: typography.meta.letterSpacing,
      color: typography.meta.color,
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
      fontSize: typography.endMessage.fontSize,
      fontWeight: typography.endMessage.fontWeight,
      color: typography.endMessage.color,
      marginBottom: spacing.xs,
    },
    endDate: {
      fontSize: typography.endDate.fontSize,
      fontWeight: typography.endDate.fontWeight,
      color: typography.endDate.color,
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
    loadingContainer: {
      flex: 1,
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
}
