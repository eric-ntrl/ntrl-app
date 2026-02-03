import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  StatusBar,
  TextInput,
  Keyboard,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { searchArticles, getDateRangeTimestamps } from '../api/search';
import { decodeHtmlEntities } from '../utils/text';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  getSavedSearches,
  addSavedSearch,
  removeSavedSearch,
  isSearchSaved,
} from '../storage/storageService';
import type { RecentSearch, SavedSearch } from '../storage/types';
import type {
  SearchResultItem,
  SearchResponse,
  SearchFilters,
  DateRangePreset,
  SearchSuggestion,
} from '../types/search';
import type { Item } from '../types';
import type { SearchScreenProps } from '../navigation/types';
import SkeletonCard from '../components/SkeletonCard';
import {
  SearchSuggestions,
  SearchFilterSheet,
  SectionCard,
  PublisherCard,
} from '../components/search';

// Debounce delay for search
const SEARCH_DEBOUNCE_MS = 300;
// Minimum characters before searching
const MIN_QUERY_LENGTH = 2;

// Suggested topics for discoverability
const SUGGESTED_TOPICS = ['Technology', 'Climate', 'Economy', 'Politics', 'Health', 'Science'];

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
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  onFocus,
  styles,
  colors,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onFocus: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: Theme['colors'];
}) {
  return (
    <View style={styles.searchInputContainer}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search NTRL"
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={onFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Search NTRL"
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

function FilterBar({
  hasFilters,
  filterCount,
  onFilterPress,
  styles,
}: {
  hasFilters: boolean;
  filterCount: number;
  onFilterPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.filterBar}>
      <Pressable
        style={({ pressed }) => [
          styles.filterButton,
          hasFilters && styles.filterButtonActive,
          pressed && styles.filterButtonPressed,
        ]}
        onPress={onFilterPress}
        accessibilityLabel={`Sort and filter${hasFilters ? `, ${filterCount} active` : ''}`}
      >
        <Text style={[styles.filterButtonIcon, hasFilters && styles.filterButtonIconActive]}>
          ☰
        </Text>
        <Text style={[styles.filterButtonText, hasFilters && styles.filterButtonTextActive]}>
          Sort & Filter
        </Text>
        {hasFilters && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{filterCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function HighlightedText({
  text,
  query,
  style,
  highlightStyle,
}: {
  text: string;
  query: string;
  style: object;
  highlightStyle: object;
}) {
  if (!query.trim()) return <Text style={style}>{text}</Text>;

  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Text key={i} style={highlightStyle}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}

function SavedSearchItem({
  search,
  onPress,
  onRemove,
  styles,
}: {
  search: SavedSearch;
  onPress: () => void;
  onRemove: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.searchItem}>
      <Pressable
        style={({ pressed }) => [styles.searchItemContent, pressed && styles.searchItemPressed]}
        onPress={onPress}
        accessibilityLabel={`Search for ${search.query}`}
      >
        <Text style={styles.searchItemIcon}>★</Text>
        <Text style={styles.searchItemText}>{search.query}</Text>
      </Pressable>
      <Pressable
        onPress={onRemove}
        style={styles.searchItemRemove}
        hitSlop={8}
        accessibilityLabel={`Remove ${search.query} from saved searches`}
      >
        <Text style={styles.searchItemRemoveText}>×</Text>
      </Pressable>
    </View>
  );
}

function RecentSearchItem({
  search,
  onPress,
  onRemove,
  styles,
}: {
  search: RecentSearch;
  onPress: () => void;
  onRemove: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.searchItem}>
      <Pressable
        style={({ pressed }) => [styles.searchItemContent, pressed && styles.searchItemPressed]}
        onPress={onPress}
        accessibilityLabel={`Search for ${search.query}`}
      >
        <Text style={styles.searchItemIcon}>↻</Text>
        <Text style={styles.searchItemText}>{search.query}</Text>
      </Pressable>
      <Pressable
        onPress={onRemove}
        style={styles.searchItemRemove}
        hitSlop={8}
        accessibilityLabel={`Remove ${search.query} from recent searches`}
      >
        <Text style={styles.searchItemRemoveText}>×</Text>
      </Pressable>
    </View>
  );
}

function SuggestedTopics({
  onTopicPress,
  styles,
}: {
  onTopicPress: (topic: string) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>SUGGESTED TOPICS</Text>
      <View style={styles.suggestionPillsContainer}>
        {SUGGESTED_TOPICS.map((topic) => (
          <Pressable
            key={topic}
            onPress={() => onTopicPress(topic)}
            style={({ pressed }) => [
              styles.suggestionPill,
              pressed && styles.suggestionPillPressed,
            ]}
            accessibilityLabel={`Search for ${topic}`}
          >
            <Text style={styles.suggestionPillText}>{topic}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ArticleCard({
  item,
  query,
  onPress,
  styles,
}: {
  item: SearchResultItem;
  query: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const timeLabel = formatRelativeTime(item.published_at);
  const headline = decodeHtmlEntities(item.feed_title);
  const summary = decodeHtmlEntities(item.feed_summary);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityLabel={`${headline}. ${item.source_name}. ${timeLabel}`}
      accessibilityRole="button"
    >
      <View style={styles.textColumn}>
        <HighlightedText
          text={headline}
          query={query}
          style={styles.headline}
          highlightStyle={styles.highlightText}
        />
        <HighlightedText
          text={summary}
          query={query}
          style={styles.summary}
          highlightStyle={styles.highlightText}
        />
        <Text style={styles.meta}>
          {item.source_name} · {timeLabel}
        </Text>
      </View>
    </Pressable>
  );
}

function LoadingState({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.loadingContainer}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

function ConnectionError({
  onRetry,
  styles,
}: {
  onRetry: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorMessage}>Unable to search.</Text>
      <Pressable onPress={onRetry}>
        <Text style={styles.retryLink}>Try again</Text>
      </Pressable>
    </View>
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
      <Text style={styles.emptyResultsMessage}>No articles match your search.</Text>
      <Text style={styles.emptyResultsHint}>Try a different keyword.</Text>
    </View>
  );
}

function ResultsHeader({
  total,
  query,
  styles,
}: {
  total: number;
  query: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.resultsHeader}>
      <Text style={styles.resultsHeaderText}>
        {total} {total === 1 ? 'result' : 'results'} for "{query}"
      </Text>
    </View>
  );
}

function EndOfResults({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.endOfResults}>
      <Text style={styles.endOfResultsText}>End of results</Text>
    </View>
  );
}

/**
 * Convert SearchResultItem to Item for navigation
 */
function toItem(result: SearchResultItem): Item {
  return {
    id: result.id,
    source: result.source_name,
    source_url: result.source_url,
    published_at: result.published_at,
    headline: result.feed_title,
    summary: result.feed_summary,
    url: result.source_url,
    has_manipulative_content: result.has_manipulative_content,
    detail: {
      title: result.detail_title || result.feed_title,
      brief: result.detail_brief || result.feed_summary,
      full: null,
      disclosure: null,
    },
  };
}

/**
 * Server-side search with full-text search, facets, and filtering.
 */
export default function SearchScreen({ navigation }: SearchScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Search state
  const [query, setQuery] = useState('');
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // UI state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Saved/recent searches
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isCurrentQuerySaved, setIsCurrentQuerySaved] = useState(false);

  // Filter state
  const [sort, setSort] = useState<'relevance' | 'recency'>('relevance');
  const [dateRange, setDateRange] = useState<DateRangePreset>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved/recent searches on mount
  useFocusEffect(
    useCallback(() => {
      async function loadSearches() {
        const [recent, saved] = await Promise.all([getRecentSearches(), getSavedSearches()]);
        setRecentSearches(recent);
        setSavedSearches(saved);
      }
      loadSearches();
    }, [])
  );

  // Check if current query is saved
  useEffect(() => {
    async function checkSaved() {
      if (query.trim()) {
        const saved = await isSearchSaved(query);
        setIsCurrentQuerySaved(saved);
      } else {
        setIsCurrentQuerySaved(false);
      }
    }
    checkSaved();
  }, [query]);

  // Execute search
  const executeSearch = useCallback(
    async (searchQuery: string, newOffset: number = 0, append: boolean = false) => {
      if (searchQuery.trim().length < MIN_QUERY_LENGTH) {
        setSearchResponse(null);
        return;
      }

      if (newOffset === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        // Build filters
        const dateTimestamps = getDateRangeTimestamps(dateRange);
        const filters: Partial<SearchFilters> = {
          sort,
          publishedAfter: dateTimestamps.after,
          publishedBefore: dateTimestamps.before,
        };

        // If only one category selected, filter by it
        if (selectedCategories.length === 1) {
          filters.category = selectedCategories[0];
        }

        const response = await searchArticles(searchQuery, filters, 20, newOffset);

        if (append && searchResponse) {
          // Append to existing results
          setSearchResponse({
            ...response,
            items: [...searchResponse.items, ...response.items],
          });
        } else {
          setSearchResponse(response);
        }

        setOffset(newOffset);

        // Announce results to screen readers
        if (newOffset === 0) {
          AccessibilityInfo.announceForAccessibility(
            `${response.total} ${response.total === 1 ? 'result' : 'results'} found`
          );
        }
      } catch (e) {
        setError('Search failed. Please try again.');
        console.log('[Search] Error:', e);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [sort, dateRange, selectedCategories, searchResponse]
  );

  // Debounced search
  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);

      // Show suggestions dropdown when typing
      if (text.trim().length >= MIN_QUERY_LENGTH) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }

      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search
      if (text.trim().length >= MIN_QUERY_LENGTH) {
        searchTimeoutRef.current = setTimeout(() => {
          executeSearch(text);
        }, SEARCH_DEBOUNCE_MS);
      } else {
        setSearchResponse(null);
      }
    },
    [executeSearch]
  );

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    setShowSuggestions(false);
    await addRecentSearch(trimmed);
    const searches = await getRecentSearches();
    setRecentSearches(searches);
    executeSearch(trimmed);
    Keyboard.dismiss();
  }, [query, executeSearch]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !searchResponse) return;
    if (searchResponse.items.length >= searchResponse.total) return;

    executeSearch(query, offset + 20, true);
  }, [isLoadingMore, searchResponse, query, offset, executeSearch]);

  const handleRecentSearchPress = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
      setShowSuggestions(false);
      executeSearch(searchQuery);
    },
    [executeSearch]
  );

  const handleRemoveRecentSearch = useCallback(async (searchQuery: string) => {
    await removeRecentSearch(searchQuery);
    const searches = await getRecentSearches();
    setRecentSearches(searches);
  }, []);

  const handleClearRecentSearches = useCallback(async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const handleSavedSearchPress = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
      setShowSuggestions(false);
      executeSearch(searchQuery);
    },
    [executeSearch]
  );

  const handleRemoveSavedSearch = useCallback(
    async (searchQuery: string) => {
      await removeSavedSearch(searchQuery);
      const searches = await getSavedSearches();
      setSavedSearches(searches);
      if (query.toLowerCase() === searchQuery.toLowerCase()) {
        setIsCurrentQuerySaved(false);
      }
    },
    [query]
  );

  const handleSaveCurrentSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    await addSavedSearch(trimmed);
    const searches = await getSavedSearches();
    setSavedSearches(searches);
    setIsCurrentQuerySaved(true);
  }, [query]);

  const handleSuggestionTap = useCallback((topic: string) => {
    setQuery(topic);
    setShowSuggestions(false);
    executeSearch(topic);
  }, [executeSearch]);

  const handleSuggestionPress = useCallback(
    (suggestion: SearchSuggestion) => {
      setShowSuggestions(false);
      if (suggestion.type === 'section') {
        // Filter by this section
        setSelectedCategories([suggestion.value]);
        executeSearch(query);
      } else if (suggestion.type === 'publisher') {
        // For publishers, add to query
        setQuery(suggestion.label);
        executeSearch(suggestion.label);
      }
    },
    [query, executeSearch]
  );

  const handleFilterApply = useCallback(
    (filters: { sort: 'relevance' | 'recency'; dateRange: DateRangePreset; categories: string[] }) => {
      setSort(filters.sort);
      setDateRange(filters.dateRange);
      setSelectedCategories(filters.categories);

      // Re-execute search with new filters
      if (query.trim().length >= MIN_QUERY_LENGTH) {
        // Need to re-execute with updated filters - they'll be used in executeSearch
        setTimeout(() => {
          executeSearch(query);
        }, 0);
      }
    },
    [query, executeSearch]
  );

  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
    if (query.trim().length >= MIN_QUERY_LENGTH) {
      setShowSuggestions(true);
    }
  }, [query]);

  const handleSectionPress = useCallback(
    (categoryKey: string) => {
      setSelectedCategories([categoryKey]);
      setShowSuggestions(false);
      if (query.trim().length >= MIN_QUERY_LENGTH) {
        executeSearch(query);
      }
    },
    [query, executeSearch]
  );

  const handlePublisherPress = useCallback(
    (publisherSlug: string, publisherName: string) => {
      setQuery(publisherName);
      setShowSuggestions(false);
      executeSearch(publisherName);
    },
    [executeSearch]
  );

  const handleRetry = useCallback(() => {
    if (query.trim().length >= MIN_QUERY_LENGTH) {
      executeSearch(query);
    }
  }, [query, executeSearch]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Compute filter count for badge
  const filterCount = useMemo(() => {
    let count = 0;
    if (sort !== 'relevance') count++;
    if (dateRange !== 'all') count++;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    return count;
  }, [sort, dateRange, selectedCategories]);

  const hasFilters = filterCount > 0;
  const showPreSearchUI = !searchResponse && !isLoading && query.trim().length < MIN_QUERY_LENGTH;
  const showResults = searchResponse && searchResponse.items.length > 0;
  const showEmptyResults = searchResponse && searchResponse.items.length === 0 && !isLoading;

  // Build mixed results (sections + publishers + articles)
  const mixedResults = useMemo(() => {
    if (!searchResponse) return [];

    const results: Array<{ type: 'section' | 'publisher' | 'article'; data: any }> = [];

    // Add section cards for matching categories (max 2)
    const matchingCategories = searchResponse.facets.categories
      .filter((c) => c.label.toLowerCase().includes(query.toLowerCase()) || c.key.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2);

    for (const cat of matchingCategories) {
      results.push({ type: 'section', data: cat });
    }

    // Add publisher cards for matching publishers (max 2)
    const matchingPublishers = searchResponse.facets.sources
      .filter((s) => s.label.toLowerCase().includes(query.toLowerCase()) || s.key.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2);

    for (const pub of matchingPublishers) {
      results.push({ type: 'publisher', data: pub });
    }

    // Add articles
    for (const item of searchResponse.items) {
      results.push({ type: 'article', data: item });
    }

    return results;
  }, [searchResponse, query]);

  const renderMixedItem = useCallback(
    ({ item }: { item: { type: 'section' | 'publisher' | 'article'; data: any } }) => {
      if (item.type === 'section') {
        return (
          <SectionCard
            sectionKey={item.data.key}
            count={item.data.count}
            onPress={() => handleSectionPress(item.data.key)}
          />
        );
      }

      if (item.type === 'publisher') {
        return (
          <PublisherCard
            slug={item.data.key}
            name={item.data.label}
            count={item.data.count}
            onPress={() => handlePublisherPress(item.data.key, item.data.label)}
          />
        );
      }

      // Article
      return (
        <ArticleCard
          item={item.data}
          query={query}
          onPress={() => navigation.navigate('ArticleDetail', { item: toItem(item.data) })}
          styles={styles}
        />
      );
    },
    [query, styles, navigation, handleSectionPress, handlePublisherPress]
  );

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
          onFocus={handleInputFocus}
          styles={styles}
          colors={colors}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && searchResponse?.suggestions && (
          <SearchSuggestions
            suggestions={searchResponse.suggestions}
            recentSearches={recentSearches}
            query={query}
            onSuggestionPress={handleSuggestionPress}
            onRecentPress={handleRecentSearchPress}
          />
        )}

        {/* Filter bar - show when there's a query */}
        {query.trim().length >= MIN_QUERY_LENGTH && (
          <FilterBar
            hasFilters={hasFilters}
            filterCount={filterCount}
            onFilterPress={() => setShowFilterSheet(true)}
            styles={styles}
          />
        )}

        {/* Save search button when searching and not already saved */}
        {searchResponse && query.trim() && !isCurrentQuerySaved && (
          <Pressable
            onPress={handleSaveCurrentSearch}
            style={({ pressed }) => [styles.saveSearchButton, pressed && styles.saveSearchButtonPressed]}
          >
            <Text style={styles.saveSearchIcon}>★</Text>
            <Text style={styles.saveSearchText}>Save this search</Text>
          </Pressable>
        )}

        {/* Error state */}
        {error && !isLoading && <ConnectionError onRetry={handleRetry} styles={styles} />}

        {/* Loading state */}
        {isLoading && <LoadingState styles={styles} />}

        {/* Pre-search UI */}
        {showPreSearchUI && (
          <ScrollView
            style={styles.preSearchScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>SAVED SEARCHES</Text>
                  <Pressable onPress={() => { /* TODO: clear saved */ }}>
                    <Text style={styles.clearAllText}>Clear all</Text>
                  </Pressable>
                </View>
                {savedSearches.map((search) => (
                  <SavedSearchItem
                    key={search.query}
                    search={search}
                    onPress={() => handleSavedSearchPress(search.query)}
                    onRemove={() => handleRemoveSavedSearch(search.query)}
                    styles={styles}
                  />
                ))}
              </View>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>RECENT SEARCHES</Text>
                  <Pressable onPress={handleClearRecentSearches}>
                    <Text style={styles.clearAllText}>Clear all</Text>
                  </Pressable>
                </View>
                {recentSearches.map((search) => (
                  <RecentSearchItem
                    key={search.query}
                    search={search}
                    onPress={() => handleRecentSearchPress(search.query)}
                    onRemove={() => handleRemoveRecentSearch(search.query)}
                    styles={styles}
                  />
                ))}
              </View>
            )}

            {/* Suggested Topics */}
            <SuggestedTopics onTopicPress={handleSuggestionTap} styles={styles} />
          </ScrollView>
        )}

        {/* Empty results */}
        {showEmptyResults && <EmptyResults query={query} styles={styles} />}

        {/* Search results */}
        {showResults && !isLoading && (
          <FlatList
            data={mixedResults}
            keyExtractor={(item, index) =>
              item.type === 'article'
                ? item.data.id
                : `${item.type}-${item.data.key}-${index}`
            }
            renderItem={renderMixedItem}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              <ResultsHeader total={searchResponse!.total} query={query} styles={styles} />
            }
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.loadingMore}>
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              ) : searchResponse!.items.length >= searchResponse!.total ? (
                <EndOfResults styles={styles} />
              ) : null
            }
          />
        )}
      </View>

      {/* Filter sheet */}
      <SearchFilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        onApply={handleFilterApply}
        sort={sort}
        dateRange={dateRange}
        selectedCategories={selectedCategories}
      />
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
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
      paddingHorizontal: spacing.md,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
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
      height: '100%',
    },
    clearSearchButton: {
      padding: spacing.xs,
    },
    clearSearchText: {
      fontSize: 20,
      color: colors.textMuted,
      fontWeight: '300',
    },

    // Filter bar
    filterBar: {
      flexDirection: 'row',
      marginBottom: spacing.md,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    filterButtonActive: {
      backgroundColor: colors.accentSecondarySubtle,
      borderColor: colors.accent,
      borderWidth: 1.5,
    },
    filterButtonPressed: {
      opacity: 0.7,
    },
    filterButtonIcon: {
      fontSize: 14,
      color: colors.textMuted,
      marginRight: spacing.xs,
    },
    filterButtonIconActive: {
      color: colors.textPrimary,
    },
    filterButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
    },
    filterButtonTextActive: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    filterBadge: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingHorizontal: spacing.xs,
      marginLeft: spacing.xs,
      minWidth: 18,
      alignItems: 'center',
    },
    filterBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.surface,
    },

    // Save search button
    saveSearchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
    },
    saveSearchButtonPressed: {
      opacity: 0.5,
    },
    saveSearchIcon: {
      fontSize: 14,
      color: colors.accent,
      marginRight: spacing.xs,
    },
    saveSearchText: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: '500',
    },

    // Pre-search scroll
    preSearchScroll: {
      flex: 1,
    },

    // Section styles
    section: {
      marginTop: spacing.lg,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      color: colors.textSubtle,
    },
    clearAllText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.accent,
    },

    // Search item (saved and recent)
    searchItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    searchItemContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    searchItemPressed: {
      opacity: 0.5,
    },
    searchItemIcon: {
      fontSize: 14,
      color: colors.textMuted,
      marginRight: spacing.sm,
      width: 20,
      textAlign: 'center',
    },
    searchItemText: {
      fontSize: 15,
      color: colors.textPrimary,
    },
    searchItemRemove: {
      padding: spacing.sm,
    },
    searchItemRemoveText: {
      fontSize: 18,
      color: colors.textMuted,
      fontWeight: '300',
    },

    // Suggested topics
    suggestionPillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    suggestionPill: {
      backgroundColor: colors.surface,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    suggestionPillPressed: {
      opacity: 0.5,
    },
    suggestionPillText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },

    // Results
    resultsList: {
      paddingBottom: spacing.xxxl,
    },
    resultsHeader: {
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
    },
    resultsHeaderText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
    },

    // Article card
    card: {
      paddingVertical: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    cardPressed: {
      backgroundColor: colors.dividerSubtle,
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
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    meta: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
    },

    // Highlight text
    highlightText: {
      backgroundColor: colors.accentSecondarySubtle,
    },

    // Loading state
    loadingContainer: {
      paddingTop: spacing.lg,
    },
    loadingMore: {
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
    loadingMoreText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
    },

    // Error state
    errorContainer: {
      alignItems: 'center',
      paddingTop: spacing.xxxl,
    },
    errorMessage: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    retryLink: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.accent,
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

    // End of Results
    endOfResults: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    endOfResultsText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSubtle,
    },
  });
}
