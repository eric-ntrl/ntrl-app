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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchBriefWithCache } from '../api';
import { getPreferences, getLastSessionCompletedAt } from '../storage/storageService';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { decodeHtmlEntities } from '../utils/text';
import { formatTimeAgo } from '../utils/dateFormatters';
import { SkeletonSection } from '../components/SkeletonCard';
import type { Item, Section, Brief } from '../types';
import type { TodayScreenProps } from '../navigation/types';

const MAX_ITEMS_PER_SECTION = 3;
const DEFAULT_HOURS_BACK = 12;

type Row =
  | { type: 'section'; section: Section }
  | { type: 'item'; item: Item }
  | { type: 'endOfFeed' };

/**
 * Filter brief items to those published after the cutoff timestamp.
 * Max 3 items per section; omit empty sections.
 */
function filterForToday(brief: Brief, cutoff: Date, selectedTopics: string[]): Row[] {
  const rows: Row[] = [];
  const cutoffMs = cutoff.getTime();

  for (const section of brief.sections) {
    // Filter by user's selected topics
    if (selectedTopics.length > 0 && !selectedTopics.includes(section.key)) {
      continue;
    }

    const recentItems = section.items
      .filter((item) => new Date(item.published_at).getTime() > cutoffMs)
      .slice(0, MAX_ITEMS_PER_SECTION);

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
 * Format date for header: "Monday, January 27"
 */
function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function Header({
  date,
  styles,
}: {
  date: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.brand}>NTRL</Text>
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.headerSubtitle}>Here are your latest articles from today.</Text>
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
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
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

function EndOfFeed({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.endOfFeed}>
      <Text style={styles.endClosing}>You're up to date.</Text>
    </View>
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
 * - Max 3 items per section; omit empty sections
 * - "You're up to date." end sentinel
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
  const [sessionCutoff, setSessionCutoff] = useState<Date | null>(null);

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

  // Reload topic preferences when screen gains focus
  useFocusEffect(
    useCallback(() => {
      getPreferences().then((prefs) => setSelectedTopics(prefs.topics));
    }, [])
  );

  const onRefresh = useCallback(() => {
    loadBrief(true);
  }, [loadBrief]);

  const now = useMemo(() => new Date(), [refreshKey]);
  const headerDate = formatHeaderDate(now);

  const rows = useMemo(() => {
    if (!brief || !sessionCutoff) return [];
    return filterForToday(brief, sessionCutoff, selectedTopics);
  }, [brief, sessionCutoff, selectedTopics]);

  const hasContent = rows.some((r) => r.type === 'item');

  const renderItem = ({ item }: { item: Row }) => {
    if (item.type === 'section') {
      return null;
    }
    if (item.type === 'endOfFeed') {
      return <EndOfFeed styles={styles} />;
    }
    const timeLabel = formatTimeAgo(item.item.published_at, now);
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
      <Header date={headerDate} styles={styles} />

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
      paddingBottom: spacing.lg,
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
    headerSubtitle: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
      marginTop: spacing.sm,
    },

    // List
    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing.xxxl,
    },

    // Section header
    sectionHeader: {
      marginTop: 28,
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: typography.sectionHeader.fontSize,
      fontWeight: typography.sectionHeader.fontWeight,
      letterSpacing: typography.sectionHeader.letterSpacing,
      color: typography.sectionHeader.color,
    },

    // Article card
    card: {
      paddingTop: spacing.xl,
      paddingBottom: 30,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: -0.2,
      marginBottom: spacing.md,
    },
    headline: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 26,
      letterSpacing: -0.2,
      color: colors.textPrimary,
    },
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
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxl,
    },
    endClosing: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
      textAlign: 'center',
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
