import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  StatusBar,
  TextInput,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { fetchBrief } from '../api';
import { decodeHtmlEntities } from '../utils/text';
import { getRecentSearches, addRecentSearch, removeRecentSearch } from '../storage/storageService';
import type { RecentSearch } from '../storage/types';
import type { Item, Brief } from '../types';
import type { SearchScreenProps } from '../navigation/types';

/**
 * Format relative time for search results
 */
function formatRelativeTime(dateString: string): string {
  const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(utcString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return 'Today';
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
      <Text style={styles.headerTitle}>Search</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function SearchInput({
  value,
  onChangeText,
  onSubmit,
  styles,
  colors,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: Theme['colors'];
}) {
  return (
    <View style={styles.searchInputContainer}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search articles..."
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Search articles"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          style={styles.clearSearchButton}
          hitSlop={8}
          accessibilityLabel="Clear search"
        >
          <Text style={styles.clearSearchText}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

function RecentSearchItem({
  query,
  onPress,
  onRemove,
  styles,
}: {
  query: string;
  onPress: () => void;
  onRemove: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.recentItem}>
      <Pressable
        style={({ pressed }) => [styles.recentItemContent, pressed && styles.recentItemPressed]}
        onPress={onPress}
        accessibilityLabel={`Search for ${query}`}
      >
        <Text style={styles.recentItemText}>{query}</Text>
      </Pressable>
      <Pressable
        onPress={onRemove}
        style={styles.recentItemRemove}
        hitSlop={8}
        accessibilityLabel={`Remove ${query} from recent searches`}
      >
        <Text style={styles.recentItemRemoveText}>×</Text>
      </Pressable>
    </View>
  );
}

function ArticleCard({
  item,
  onPress,
  styles,
}: {
  item: Item;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const timeLabel = formatRelativeTime(item.published_at);
  const headline = decodeHtmlEntities(item.headline);
  const summary = decodeHtmlEntities(item.summary);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityLabel={`${headline}. ${item.source}. ${timeLabel}`}
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

function EmptyResults({
  query,
  styles,
}: {
  query: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.emptyResults}>
      <Text style={styles.emptyResultsMessage}>No results for "{query}"</Text>
      <Text style={styles.emptyResultsHint}>Try a different search term</Text>
    </View>
  );
}

/**
 * Provides client-side search across the current daily brief articles.
 * - Filters articles by matching query against headlines and summaries
 * - Maintains and displays recent search history with remove support
 * - Navigates to ArticleDetail when a result is tapped
 */
export default function SearchScreen({ navigation }: SearchScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Load recent searches and brief on mount
  useFocusEffect(
    useCallback(() => {
      async function load() {
        const [searches, briefData] = await Promise.all([
          getRecentSearches(),
          fetchBrief().catch(() => null),
        ]);
        setRecentSearches(searches);
        if (briefData) {
          setBrief(briefData);
        }
      }
      load();
    }, [])
  );

  // Filter articles based on search query
  const searchResults = useMemo(() => {
    if (!query.trim() || !brief) return [];

    const searchTerm = query.toLowerCase().trim();
    const results: Item[] = [];

    for (const section of brief.sections) {
      for (const item of section.items) {
        const matchesHeadline = item.headline.toLowerCase().includes(searchTerm);
        const matchesSummary = item.summary.toLowerCase().includes(searchTerm);
        if (matchesHeadline || matchesSummary) {
          results.push(item);
        }
      }
    }

    return results;
  }, [query, brief]);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    await addRecentSearch(trimmed);
    const searches = await getRecentSearches();
    setRecentSearches(searches);
    Keyboard.dismiss();
  }, [query]);

  const handleRecentSearchPress = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    setIsSearching(true);
  }, []);

  const handleRemoveRecentSearch = useCallback(async (searchQuery: string) => {
    await removeRecentSearch(searchQuery);
    const searches = await getRecentSearches();
    setRecentSearches(searches);
  }, []);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    setIsSearching(text.trim().length > 0);
  }, []);

  const renderSearchResult = ({ item }: { item: Item }) => (
    <ArticleCard
      item={item}
      onPress={() => navigation.navigate('ArticleDetail', { item })}
      styles={styles}
    />
  );

  const showRecentSearches = !isSearching && recentSearches.length > 0;
  const showResults = isSearching && query.trim().length > 0;
  const showEmptyResults = showResults && searchResults.length === 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Header onBack={() => navigation.goBack()} styles={styles} />

      <View style={styles.content}>
        <SearchInput
          value={query}
          onChangeText={handleQueryChange}
          onSubmit={handleSearch}
          styles={styles}
          colors={colors}
        />

        {showRecentSearches && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>RECENT SEARCHES</Text>
            {recentSearches.map((search) => (
              <RecentSearchItem
                key={search.query}
                query={search.query}
                onPress={() => handleRecentSearchPress(search.query)}
                onRemove={() => handleRemoveRecentSearch(search.query)}
                styles={styles}
              />
            ))}
          </View>
        )}

        {showEmptyResults && <EmptyResults query={query} styles={styles} />}

        {showResults && searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderSearchResult}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
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
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 40,
    },

    // Content
    content: {
      flex: 1,
      paddingHorizontal: layout.screenPadding,
    },

    // Search Input
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },
    searchIcon: {
      fontSize: 18,
      color: colors.textMuted,
      marginRight: spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
      paddingVertical: spacing.md,
    },
    clearSearchButton: {
      padding: spacing.xs,
    },
    clearSearchText: {
      fontSize: 20,
      color: colors.textMuted,
      fontWeight: '300',
    },

    // Recent Searches
    recentSection: {
      marginTop: spacing.md,
    },
    recentTitle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      color: colors.textSubtle,
      marginBottom: spacing.md,
    },
    recentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    recentItemContent: {
      flex: 1,
      paddingVertical: spacing.sm,
    },
    recentItemPressed: {
      opacity: 0.5,
    },
    recentItemText: {
      fontSize: 15,
      color: colors.textPrimary,
    },
    recentItemRemove: {
      padding: spacing.sm,
    },
    recentItemRemoveText: {
      fontSize: 18,
      color: colors.textMuted,
      fontWeight: '300',
    },

    // Results
    resultsList: {
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

    // Empty Results
    emptyResults: {
      alignItems: 'center',
      paddingTop: spacing.xxxl,
    },
    emptyResultsMessage: {
      fontSize: 17,
      fontWeight: '500',
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    emptyResultsHint: {
      fontSize: 15,
      fontWeight: '400',
      color: colors.textSubtle,
    },
  });
}
