import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ScrollView,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchBriefWithCache } from '../api';
import { getPreferences, getLastSessionCompletedAt } from '../storage/storageService';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { decodeHtmlEntities } from '../utils/text';
import { formatTodayTimestamp } from '../utils/dateFormatters';
import { SkeletonSection } from '../components/SkeletonCard';
import type { Item, Brief } from '../types';
import type { TodayScreenProps } from '../navigation/types';
import ProgressBar from '../components/ProgressBar';

const DEFAULT_HOURS_BACK = 12;
const DEFAULT_ARTICLE_CAP = 7;

type Row = { type: 'item'; item: Item } | { type: 'endOfFeed' };

// Map section keys to display names for header
const TOPIC_DISPLAY_NAMES: Record<string, string> = {
  world: 'World',
  us: 'U.S.',
  local: 'Local',
  business: 'Business',
  technology: 'Technology',
  science: 'Science',
  health: 'Health',
  environment: 'Environment',
  sports: 'Sports',
  culture: 'Culture',
};

/**
 * Filter brief items to those published after the cutoff timestamp.
 * Returns up to maxItems articles (user's article cap) and tracks if there are more.
 */
function filterForToday(
  brief: Brief,
  cutoff: Date,
  selectedTopics: string[],
  maxItems: number
): { rows: Row[]; hasMore: boolean } {
  const rows: Row[] = [];
  const cutoffMs = cutoff.getTime();
  let totalItems = 0;
  let itemsAdded = 0;

  for (const section of brief.sections) {
    // Filter by user's selected topics
    if (selectedTopics.length > 0 && !selectedTopics.includes(section.key)) {
      continue;
    }

    const recentItems = section.items.filter(
      (item) => new Date(item.published_at).getTime() > cutoffMs
    );

    totalItems += recentItems.length;

    for (const item of recentItems) {
      if (itemsAdded < maxItems) {
        rows.push({ type: 'item', item });
        itemsAdded++;
      }
    }
  }

  rows.push({ type: 'endOfFeed' });
  return { rows, hasMore: totalItems > maxItems };
}

/**
 * Format date line for header: "Today • Monday, January 27"
 */
function formatHeaderDateLine(date: Date): string {
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return `Today • ${formatted}`;
}

/**
 * Get time-aware greeting based on hour of day.
 * 0am–5am: "Hello" (late night)
 * 5am–12pm: "Good morning"
 * 12pm–5pm: "Good afternoon"
 * 5pm+: "Good evening"
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) return 'Hello';
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function Header({
  dateLine,
  sections,
  onSearchPress,
  onSectionsPress,
  styles,
}: {
  dateLine: string;
  sections: string[]; // Display names: ['World', 'Business', 'Sports']
  onSearchPress: () => void;
  onSectionsPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const greeting = getGreeting();

  // Truncate to first 3 sections with ellipsis if more
  const displaySections = sections.slice(0, 3);
  const hasMore = sections.length > 3;
  const sectionsText = displaySections.join(' • ') + (hasMore ? '…' : '');

  return (
    <View style={styles.header}>
      {/* Top bar: NTRL brand + search icon */}
      <View style={styles.headerTopBar}>
        <Text style={styles.brand}>NTRL</Text>
        <Pressable
          style={({ pressed }) => [styles.headerIcon, pressed && styles.headerIconPressed]}
          onPress={onSearchPress}
          hitSlop={8}
          accessibilityLabel="Search"
          accessibilityRole="button"
        >
          <Text style={styles.headerIconText}>⌕</Text>
        </Pressable>
      </View>

      {/* Line 1: "Today • Monday, January 27" */}
      <Text style={styles.dateLine}>{dateLine}</Text>

      {/* Line 2: "{Greeting}. Highlights from your sections." */}
      <Text style={styles.greetingLine}>{greeting}. Highlights from your sections.</Text>

      {/* Line 3: Truncated sections list (tappable if more than 3) */}
      {sections.length > 0 && (
        <Pressable onPress={hasMore ? onSectionsPress : undefined} disabled={!hasMore} hitSlop={8}>
          {({ pressed }) => (
            <Text style={[styles.sectionsText, hasMore && pressed && { opacity: 0.6 }]}>
              {sectionsText}
            </Text>
          )}
        </Pressable>
      )}
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
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <View style={styles.textColumn}>
        <Text style={styles.articleText} numberOfLines={5} ellipsizeMode="tail">
          <Text style={styles.headline}>{headline}</Text>
          {'  '}
          <Text style={styles.summary}>{summary}</Text>
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.source}>{item.source}</Text>
          <Text style={styles.metaSeparator}> · </Text>
          <Text style={styles.timestamp}>{timeLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function EndOfFeed({
  hasMore,
  onSeeEarlier,
  styles,
}: {
  hasMore: boolean;
  onSeeEarlier: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.endOfFeed}>
      <Text style={styles.endMessage}>You're up to date</Text>
      {hasMore && (
        <Pressable onPress={onSeeEarlier} hitSlop={12}>
          {({ pressed }) => (
            <Text style={[styles.seeEarlierText, pressed && { opacity: 0.6 }]}>
              See earlier stories
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

function ProgressHint({
  current,
  total,
  styles,
}: {
  current: number;
  total: number;
  styles: ReturnType<typeof createStyles>;
}) {
  // Only show near end of list
  if (current < total - 2) return null;
  return (
    <Text style={styles.progressHint}>
      {current + 1} of {total} stories
    </Text>
  );
}

function LoadingState() {
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 20 }}>
        <SkeletonSection count={2} />
        <SkeletonSection count={2} />
      </View>
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

/**
 * TodayScreen — session-filtered view showing items published since last session.
 * - Loads last_session_completed_at from storage
 * - Fetches brief, filters items newer than that timestamp
 * - Also filters by user's selected topics
 * - Respects user's article cap setting (default 7, range 3-15)
 * - "You're up to date" end sentinel with "See earlier stories" if more available
 */
export default function TodayScreen({ navigation }: TodayScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [articleCap, setArticleCap] = useState(DEFAULT_ARTICLE_CAP);
  const [sessionCutoff, setSessionCutoff] = useState<Date | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load session cutoff on mount
  useEffect(() => {
    async function loadCutoff() {
      const lastSession = await getLastSessionCompletedAt();
      if (lastSession) {
        setSessionCutoff(new Date(lastSession));
      } else {
        // First launch fallback: show items from last 12 hours
        const fallback = new Date();
        fallback.setHours(fallback.getHours() - DEFAULT_HOURS_BACK);
        setSessionCutoff(fallback);
      }
    }
    loadCutoff();
  }, []);

  const loadBrief = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setRefreshKey((k) => k + 1);
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

  // Reload preferences when screen gains focus
  useFocusEffect(
    useCallback(() => {
      getPreferences().then((prefs) => {
        setSelectedTopics(prefs.topics);
        setArticleCap(prefs.todayArticleCap ?? DEFAULT_ARTICLE_CAP);
      });
    }, [])
  );

  const onRefresh = useCallback(() => {
    loadBrief(true);
  }, [loadBrief]);

  const now = useMemo(() => new Date(), [refreshKey]);
  const headerDateLine = formatHeaderDateLine(now);

  const { rows, hasMore } = useMemo(() => {
    if (!brief || !sessionCutoff) return { rows: [], hasMore: false };
    return filterForToday(brief, sessionCutoff, selectedTopics, articleCap);
  }, [brief, sessionCutoff, selectedTopics, articleCap]);

  const articleCount = useMemo(() => {
    return rows.filter((r) => r.type === 'item').length;
  }, [rows]);

  const hasContent = articleCount > 0;

  // Get display names for selected topics that have content
  const sectionNames = useMemo(() => {
    if (!brief || selectedTopics.length === 0) return [];
    return selectedTopics
      .filter((key) => {
        const section = brief.sections.find((s) => s.key === key);
        return section && section.items.length > 0;
      })
      .map((key) => TOPIC_DISPLAY_NAMES[key] || key);
  }, [brief, selectedTopics]);

  const handleSeeEarlier = useCallback(() => {
    navigation.navigate('SectionsTab', { screen: 'Sections' });
  }, [navigation]);

  // Viewability tracking for progress indicator
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const lastItem = viewableItems[viewableItems.length - 1];
      if (lastItem?.item?.type === 'item') {
        const idx = rows.findIndex((r) => r === lastItem.item);
        if (idx >= 0) setCurrentIndex(idx);
      }
    },
    [rows]
  );

  const renderItem = ({ item }: { item: Row }) => {
    if (item.type === 'endOfFeed') {
      return (
        <>
          <ProgressBar current={currentIndex} total={articleCount} />
          <ProgressHint current={currentIndex} total={articleCount} styles={styles} />
          <EndOfFeed hasMore={hasMore} onSeeEarlier={handleSeeEarlier} styles={styles} />
        </>
      );
    }
    const timeLabel = formatTodayTimestamp(item.item.published_at);
    return (
      <ArticleCard
        item={item.item}
        timeLabel={timeLabel}
        onPress={() => navigation.navigate('ArticleDetail', { item: item.item })}
        styles={styles}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Header
        dateLine={headerDateLine}
        sections={sectionNames}
        onSearchPress={() => navigation.navigate('Search')}
        onSectionsPress={() => navigation.navigate('ProfileTab', { screen: 'Profile' })}
        styles={styles}
      />

      {loading && !brief ? (
        <LoadingState />
      ) : error && !brief ? (
        <ErrorState message={error} onRetry={() => loadBrief()} styles={styles} />
      ) : !hasContent ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyMessage}>You're up to date.</Text>
          <Text style={styles.emptySubtext}>No new articles since your last visit.</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => (r.type === 'endOfFeed' ? 'end-of-feed' : `item-${r.item.id}`)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
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

function createStyles(theme: Theme) {
  const { colors, typography, spacing, layout } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header
    header: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    headerTopBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    brand: {
      fontSize: typography.brand.fontSize,
      fontWeight: typography.brand.fontWeight,
      letterSpacing: typography.brand.letterSpacing,
      color: colors.textPrimary,
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
      fontSize: 26,
      color: colors.textMuted,
    },
    dateLine: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 2,
      color: colors.textSubtle,
      textTransform: 'uppercase',
      marginBottom: spacing.md,
    },
    greetingLine: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    sectionsText: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textSubtle,
    },

    // List
    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing.xxxl,
    },

    // Article card
    card: {
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxl,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
      alignSelf: 'stretch',
      width: '100%',
      overflow: 'hidden',
    },
    textColumn: {
      flex: 1,
      minWidth: 0,
      alignSelf: 'stretch',
    },
    articleText: {
      fontSize: typography.headline.fontSize,
      lineHeight: typography.summary.lineHeight,
      letterSpacing: typography.headline.letterSpacing,
      marginBottom: spacing.md,
    },
    headline: {
      fontSize: typography.headline.fontSize,
      fontWeight: typography.headline.fontWeight,
      lineHeight: typography.headline.lineHeight,
      letterSpacing: typography.headline.letterSpacing,
      color: typography.headline.color,
    },
    summary: {
      fontSize: typography.summary.fontSize,
      fontWeight: typography.summary.fontWeight,
      lineHeight: typography.summary.lineHeight,
      letterSpacing: typography.summary.letterSpacing,
      color: typography.summary.color,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    source: {
      fontSize: typography.meta.fontSize,
      fontWeight: '500',
      color: colors.textMuted,
    },
    metaSeparator: {
      fontSize: typography.meta.fontSize,
      color: colors.textSubtle,
    },
    timestamp: {
      fontSize: typography.meta.fontSize,
      fontWeight: '400',
      color: colors.textSubtle,
    },

    // End of feed
    endOfFeed: {
      alignItems: 'center',
      paddingVertical: spacing.xxxl,
    },
    endMessage: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
    },
    seeEarlierText: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.accent,
      marginTop: spacing.lg,
      textDecorationLine: 'underline',
    },

    // Progress hint
    progressHint: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textSubtle,
      textAlign: 'center',
      paddingVertical: spacing.md,
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
      fontWeight: '500',
      color: colors.textMuted,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textSubtle,
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
