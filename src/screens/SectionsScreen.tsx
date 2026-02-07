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
import { SkeletonSection } from '../components/SkeletonCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchBriefWithCache } from '../api';
import { getPreferences } from '../storage/storageService';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { decodeHtmlEntities } from '../utils/text';
import { formatSectionsTimestamp } from '../utils/dateFormatters';
import type { Item, Section, Brief } from '../types';
import type { SectionsScreenProps } from '../navigation/types';
import { CategoryPills } from '../components/CategoryPills';
import ProgressBar from '../components/ProgressBar';

type Row =
  | { type: 'section'; section: Section }
  | { type: 'item'; item: Item }
  | { type: 'sectionEnd'; sectionKey: string; sectionTitle: string; hasMore: boolean }
  | { type: 'endOfFeed' };

/**
 * Flatten brief into rows for FlatList rendering.
 * Respects article cap per section with inline expansion support.
 */
function flatten(b: Brief, articleCap: number, expandedSections: Set<string>): Row[] {
  const rows: Row[] = [];

  for (const section of b.sections) {
    if (section.items.length > 0) {
      rows.push({ type: 'section', section });

      const isExpanded = expandedSections.has(section.key);
      const maxItems = isExpanded ? section.items.length : articleCap;
      const displayItems = section.items.slice(0, maxItems);
      const hasMore = section.items.length > maxItems;

      for (const item of displayItems) {
        rows.push({ type: 'item', item });
      }

      rows.push({
        type: 'sectionEnd',
        sectionKey: section.key,
        sectionTitle: section.title,
        hasMore,
      });
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

function Header({
  onSearchPress,
  styles,
}: {
  onSearchPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerLeft}>
          <Text style={styles.brand}>NTRL</Text>
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
        </View>
      </View>
    </View>
  );
}

function StickySectionHeader({
  title,
  styles,
}: {
  title: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.stickySectionHeader}>
      <Text style={styles.stickySectionText}>{title} — stories from the last 24 hours</Text>
    </View>
  );
}

function SectionEnd({
  sectionTitle,
  hasMore,
  onSeeMore,
  styles,
}: {
  sectionTitle: string;
  hasMore: boolean;
  onSeeMore: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.sectionEnd}>
      <Text style={styles.sectionEndText}>
        {hasMore
          ? `Showing top stories from ${sectionTitle}`
          : `No more stories in ${sectionTitle} today.`}
      </Text>
      {hasMore && (
        <Pressable onPress={onSeeMore} hitSlop={12}>
          {({ pressed }) => (
            <Text style={[styles.seeMoreLink, pressed && { opacity: 0.6 }]}>
              See more stories in {sectionTitle}
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
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
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

function EndOfFeed({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.endOfFeed}>
      <Text style={styles.endClosing}>You're up to date.</Text>
    </View>
  );
}

function LoadingState({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <ScrollView style={styles.loadingContainer} showsVerticalScrollIndicator={false}>
      <SkeletonSection />
      <SkeletonSection />
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
 * Displays the main daily news brief as a sectioned feed.
 * - Fetches and caches the brief from the API, with pull-to-refresh support
 * - Filters sections client-side based on user topic preferences
 * - Configurable article cap per section with inline expansion
 * - Calm timestamps and progress indicators
 * - Navigates to ArticleDetail, Search, or Profile on user interaction
 */
export default function SectionsScreen({ navigation }: SectionsScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;

  const styles = useMemo(() => createStyles(theme), [theme]);

  const flatListRef = useRef<FlatList<Row>>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollLockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);
  const [sectionsArticleCap, setSectionsArticleCap] = useState(7);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // Load topic preferences and article cap when screen gains focus
  useFocusEffect(
    useCallback(() => {
      getPreferences().then((prefs) => {
        setSelectedTopics(prefs.topics);
        setSectionsArticleCap(prefs.sectionsArticleCap ?? 7);
      });
    }, [])
  );

  const onRefresh = useCallback(() => {
    loadBrief(true);
  }, [loadBrief]);

  // Filter brief sections by user's selected topics
  const filteredBrief = useMemo(() => {
    if (!brief) return null;
    if (selectedTopics.length === 0) return brief;
    return {
      ...brief,
      sections: brief.sections.filter((s) => selectedTopics.includes(s.key)),
    };
  }, [brief, selectedTopics]);

  const now = useMemo(() => new Date(), [refreshKey]);
  const headerDate = formatHeaderDate(now);
  const rows = useMemo(
    () => (filteredBrief ? flatten(filteredBrief, sectionsArticleCap, expandedSections) : []),
    [filteredBrief, sectionsArticleCap, expandedSections]
  );

  // Count total articles for progress bar
  const articleCount = useMemo(() => {
    return rows.filter((r) => r.type === 'item').length;
  }, [rows]);

  // Build category list for pills from sections that have content
  const categories = useMemo(() => {
    if (!filteredBrief) return [];
    return filteredBrief.sections
      .filter((s) => s.items.length > 0)
      .map((s) => ({ key: s.key, title: s.title }));
  }, [filteredBrief]);

  // Map section keys to their row indices for scrollToIndex
  const sectionIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((row, index) => {
      if (row.type === 'section') {
        map[row.section.key] = index;
      }
    });
    return map;
  }, [rows]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollLockTimeoutRef.current) {
        clearTimeout(scrollLockTimeoutRef.current);
      }
    };
  }, []);

  // Handle pill press to scroll to section
  const handlePillPress = useCallback(
    (key: string) => {
      if (scrollLockTimeoutRef.current) {
        clearTimeout(scrollLockTimeoutRef.current);
      }

      isProgrammaticScrollRef.current = true;
      setActiveSectionKey(key);

      const index = sectionIndexMap[key];
      if (index !== undefined && flatListRef.current) {
        // Scroll to first article (index + 1), not section spacer row
        flatListRef.current.scrollToIndex({
          index: index + 1,
          animated: true,
          viewPosition: 0,
        });
      }

      scrollLockTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    },
    [sectionIndexMap]
  );

  // Handle inline expansion of sections
  const handleSeeMore = useCallback((sectionKey: string) => {
    setExpandedSections((prev) => new Set(prev).add(sectionKey));
  }, []);

  // Track which section is visible and current progress
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Row>[] }) => {
      // Track current index for progress
      const lastItem = viewableItems[viewableItems.length - 1];
      if (lastItem?.index !== undefined && lastItem.index !== null) {
        setCurrentIndex(lastItem.index);
      }

      // Skip section tracking during programmatic scroll
      if (isProgrammaticScrollRef.current) {
        return;
      }

      // Find the first visible section header
      const visibleSections = viewableItems
        .filter((v) => v.isViewable && v.item.type === 'section')
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

      if (visibleSections.length > 0) {
        const firstSection = visibleSections[0].item;
        if (firstSection.type === 'section') {
          setActiveSectionKey(firstSection.section.key);
        }
      }
    }
  ).current;

  const renderItem = ({ item }: { item: Row }) => {
    if (item.type === 'section') {
      // Sticky header handles section titles; render spacing only
      return <View style={styles.sectionSpacer} />;
    }

    if (item.type === 'sectionEnd') {
      return (
        <SectionEnd
          sectionTitle={item.sectionTitle}
          hasMore={item.hasMore}
          onSeeMore={() => handleSeeMore(item.sectionKey)}
          styles={styles}
        />
      );
    }

    if (item.type === 'endOfFeed') {
      return (
        <>
          <ProgressBar current={currentIndex} total={articleCount} />
          <EndOfFeed styles={styles} />
        </>
      );
    }

    const timeLabel = formatSectionsTimestamp(item.item.published_at);
    return (
      <ArticleCard
        item={item.item}
        timeLabel={timeLabel}
        onPress={() => navigation.navigate('ArticleDetail', { item: item.item })}
        styles={styles}
      />
    );
  };

  const hasContent = rows.some((r) => r.type === 'item');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Header onSearchPress={() => navigation.navigate('Search')} styles={styles} />
      {categories.length > 0 && (
        <CategoryPills
          categories={categories}
          onPillPress={handlePillPress}
          activeKey={activeSectionKey}
          label="SECTIONS"
          sublabel={headerDate}
        />
      )}
      {activeSectionKey && (
        <StickySectionHeader
          title={categories.find((c) => c.key === activeSectionKey)?.title || ''}
          styles={styles}
        />
      )}

      {loading && !brief ? (
        <LoadingState styles={styles} />
      ) : error && !brief ? (
        <ErrorState message={error} onRetry={() => loadBrief()} styles={styles} />
      ) : !hasContent ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyMessage}>No new updates right now.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={rows}
          keyExtractor={(r, idx) =>
            r.type === 'section'
              ? `section-${r.section.key}`
              : r.type === 'sectionEnd'
                ? `section-end-${r.sectionKey}`
                : r.type === 'endOfFeed'
                  ? 'end-of-feed'
                  : `item-${r.item.id}`
          }
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
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: false,
            });
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0,
              });
            }, 100);
          }}
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
      paddingBottom: 0,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
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
      fontSize: 26,
      color: colors.textMuted,
    },
    brand: {
      fontSize: typography.brand.fontSize,
      fontWeight: typography.brand.fontWeight,
      letterSpacing: typography.brand.letterSpacing,
      color: colors.textPrimary,
    },

    // Sticky section header
    stickySectionHeader: {
      backgroundColor: colors.background,
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    stickySectionText: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSecondary,
    },

    // List
    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing.xxxl,
    },

    // Section spacer (title handled by sticky header)
    sectionSpacer: {
      height: spacing.xxxl,
    },

    // Section end
    sectionEnd: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: layout.screenPadding,
    },
    sectionEndText: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textSubtle,
      textAlign: 'center',
    },
    seeMoreLink: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.accent,
      marginTop: spacing.md,
      textDecorationLine: 'underline',
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
    cardPressed: {
      opacity: 0.85,
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
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxl,
    },
    endClosing: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
      textAlign: 'center',
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
