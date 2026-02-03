import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme/types';
import type {
  DateRangePreset,
  FilterMode,
  SearchFiltersV2,
  TrendingTopic,
  FacetCount,
} from '../../types/search';
import { getTrendingTopics } from '../../api/topics';

// Category definitions with display names
const CATEGORIES = [
  { key: 'world', label: 'World' },
  { key: 'us', label: 'U.S.' },
  { key: 'local', label: 'Local' },
  { key: 'business', label: 'Business' },
  { key: 'technology', label: 'Technology' },
  { key: 'science', label: 'Science' },
  { key: 'health', label: 'Health' },
  { key: 'environment', label: 'Environment' },
  { key: 'sports', label: 'Sports' },
  { key: 'culture', label: 'Culture' },
];

const DATE_RANGES: { key: DateRangePreset; label: string }[] = [
  { key: '24h', label: '24h' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'all', label: 'All time' },
];

type SearchFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: SearchFiltersV2) => void;
  // Current filter state
  filters: SearchFiltersV2;
  // Publisher facets from search response (for multi-select)
  publisherFacets?: FacetCount[];
};

/**
 * Redesigned bottom sheet for sort and filter options.
 *
 * Features:
 * - Mode toggle between Topics and Categories & Publishers
 * - Trending topics with article counts (single-select)
 * - Multi-select categories
 * - Multi-select publishers (from search facets)
 * - Date range and sort options
 */
export default function SearchFilterSheet({
  visible,
  onClose,
  onApply,
  filters: initialFilters,
  publisherFacets = [],
}: SearchFilterSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors, spacing } = theme;

  const sheetMinHeight = windowHeight * 0.75;
  const sheetMaxHeight = windowHeight * 0.90;

  // Local editing state
  const [mode, setMode] = useState<FilterMode>(initialFilters.mode);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(
    initialFilters.selectedTopic
  );
  const [categories, setCategories] = useState<string[]>(initialFilters.categories);
  const [sources, setSources] = useState<string[]>(initialFilters.sources);
  const [dateRange, setDateRange] = useState<DateRangePreset>(initialFilters.dateRange);
  const [sort, setSort] = useState<'relevance' | 'recency'>(initialFilters.sort);

  // Trending topics state
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Reset local state when sheet opens
  useEffect(() => {
    if (visible) {
      setMode(initialFilters.mode);
      setSelectedTopic(initialFilters.selectedTopic);
      setCategories(initialFilters.categories);
      setSources(initialFilters.sources);
      setDateRange(initialFilters.dateRange);
      setSort(initialFilters.sort);
    }
  }, [visible, initialFilters]);

  // Fetch trending topics when sheet opens and mode is topics
  useEffect(() => {
    if (visible && mode === 'topics' && trendingTopics.length === 0) {
      setLoadingTopics(true);
      getTrendingTopics()
        .then((response) => {
          setTrendingTopics(response.topics);
        })
        .catch((error) => {
          console.log('[FilterSheet] Failed to fetch trending topics:', error);
        })
        .finally(() => {
          setLoadingTopics(false);
        });
    }
  }, [visible, mode, trendingTopics.length]);

  const handleModeChange = useCallback((newMode: FilterMode) => {
    setMode(newMode);
    // Clear the other mode's selections when switching
    if (newMode === 'topics') {
      setCategories([]);
      setSources([]);
    } else if (newMode === 'categories') {
      setSelectedTopic(null);
    }
  }, []);

  const handleTopicSelect = useCallback((topic: TrendingTopic) => {
    setSelectedTopic(topic.term);
    // Topics mode is single-select and applies immediately
  }, []);

  const handleCategoryToggle = useCallback((categoryKey: string) => {
    setCategories((prev) =>
      prev.includes(categoryKey)
        ? prev.filter((c) => c !== categoryKey)
        : [...prev, categoryKey]
    );
  }, []);

  const handleSourceToggle = useCallback((sourceKey: string) => {
    setSources((prev) =>
      prev.includes(sourceKey)
        ? prev.filter((s) => s !== sourceKey)
        : [...prev, sourceKey]
    );
  }, []);

  const handleClear = useCallback(() => {
    setMode(null);
    setSelectedTopic(null);
    setCategories([]);
    setSources([]);
    setDateRange('all');
    setSort('relevance');
  }, []);

  const handleApply = useCallback(() => {
    onApply({
      mode,
      selectedTopic,
      categories,
      sources,
      dateRange,
      sort,
    });
    onClose();
  }, [onApply, onClose, mode, selectedTopic, categories, sources, dateRange, sort]);

  const hasFilters =
    mode !== null ||
    selectedTopic !== null ||
    categories.length > 0 ||
    sources.length > 0 ||
    dateRange !== 'all' ||
    sort !== 'relevance';

  const categoryCount = categories.length;
  const sourceCount = sources.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[styles.sheet, { minHeight: sheetMinHeight, maxHeight: sheetMaxHeight }]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(spacing.xxxl + insets.bottom, 48) },
            ]}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            {/* Handle bar */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Sort & Filter</Text>
              {hasFilters && (
                <Pressable onPress={handleClear}>
                  <Text style={styles.clearText}>Clear all</Text>
                </Pressable>
              )}
            </View>

            {/* Sort section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SORT BY</Text>
              <View style={styles.optionGroup}>
                <Pressable
                  style={[
                    styles.optionButton,
                    sort === 'relevance' && styles.optionButtonActive,
                  ]}
                  onPress={() => setSort('relevance')}
                  accessibilityState={{ selected: sort === 'relevance' }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      sort === 'relevance' && styles.optionTextActive,
                    ]}
                  >
                    Relevance
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    sort === 'recency' && styles.optionButtonActive,
                  ]}
                  onPress={() => setSort('recency')}
                  accessibilityState={{ selected: sort === 'recency' }}
                >
                  <Text
                    style={[styles.optionText, sort === 'recency' && styles.optionTextActive]}
                  >
                    Most recent
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Date range section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DATE RANGE</Text>
              <View style={styles.optionGroup}>
                {DATE_RANGES.map((range) => (
                  <Pressable
                    key={range.key}
                    style={[
                      styles.optionButton,
                      dateRange === range.key && styles.optionButtonActive,
                    ]}
                    onPress={() => setDateRange(range.key)}
                    accessibilityState={{ selected: dateRange === range.key }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        dateRange === range.key && styles.optionTextActive,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Discover by section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DISCOVER BY</Text>
              <View style={styles.modeToggle}>
                <Pressable
                  style={[
                    styles.modeButton,
                    mode === 'topics' && styles.modeButtonActive,
                  ]}
                  onPress={() => handleModeChange('topics')}
                  accessibilityState={{ selected: mode === 'topics' }}
                >
                  <View style={styles.radioOuter}>
                    {mode === 'topics' && <View style={styles.radioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.modeButtonText,
                      mode === 'topics' && styles.modeButtonTextActive,
                    ]}
                  >
                    Topics
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.modeButton,
                    mode === 'categories' && styles.modeButtonActive,
                  ]}
                  onPress={() => handleModeChange('categories')}
                  accessibilityState={{ selected: mode === 'categories' }}
                >
                  <View style={styles.radioOuter}>
                    {mode === 'categories' && <View style={styles.radioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.modeButtonText,
                      mode === 'categories' && styles.modeButtonTextActive,
                    ]}
                  >
                    Categories & Publishers
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Topics mode content */}
            {mode === 'topics' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TRENDING TOPICS</Text>
                <Text style={styles.sectionHint}>
                  Topics are trending themes from recent articles
                </Text>
                {loadingTopics ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.accent} />
                    <Text style={styles.loadingText}>Loading topics...</Text>
                  </View>
                ) : trendingTopics.length === 0 ? (
                  <Text style={styles.emptyText}>No trending topics available</Text>
                ) : (
                  <View style={styles.topicsGrid}>
                    {trendingTopics.map((topic) => {
                      const isSelected = selectedTopic === topic.term;
                      return (
                        <Pressable
                          key={topic.term}
                          style={[styles.topicChip, isSelected && styles.topicChipActive]}
                          onPress={() => handleTopicSelect(topic)}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text
                            style={[
                              styles.topicText,
                              isSelected && styles.topicTextActive,
                            ]}
                          >
                            {topic.label}
                          </Text>
                          <Text
                            style={[
                              styles.topicCount,
                              isSelected && styles.topicCountActive,
                            ]}
                          >
                            ({topic.count})
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Categories mode content */}
            {mode === 'categories' && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>CATEGORIES</Text>
                  <View style={styles.chipsGrid}>
                    {CATEGORIES.map((category) => {
                      const isSelected = categories.includes(category.key);
                      return (
                        <Pressable
                          key={category.key}
                          style={[
                            styles.categoryChip,
                            isSelected && styles.categoryChipActive,
                          ]}
                          onPress={() => handleCategoryToggle(category.key)}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              isSelected && styles.categoryTextActive,
                            ]}
                          >
                            {category.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {categoryCount > 0 && (
                    <Text style={styles.selectionHint}>{categoryCount} selected</Text>
                  )}
                </View>

                {/* Publishers section */}
                {publisherFacets.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PUBLISHERS</Text>
                    <View style={styles.chipsGrid}>
                      {publisherFacets.map((publisher) => {
                        const isSelected = sources.includes(publisher.key);
                        return (
                          <Pressable
                            key={publisher.key}
                            style={[
                              styles.publisherChip,
                              isSelected && styles.publisherChipActive,
                            ]}
                            onPress={() => handleSourceToggle(publisher.key)}
                            accessibilityState={{ selected: isSelected }}
                          >
                            <Text
                              style={[
                                styles.publisherText,
                                isSelected && styles.publisherTextActive,
                              ]}
                            >
                              {publisher.label}
                            </Text>
                            <Text
                              style={[
                                styles.publisherCount,
                                isSelected && styles.publisherCountActive,
                              ]}
                            >
                              ({publisher.count})
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {sourceCount > 0 && (
                      <Text style={styles.selectionHint}>{sourceCount} selected</Text>
                    )}
                  </View>
                )}
              </>
            )}

            {/* Apply button */}
            <Pressable
              style={({ pressed }) => [styles.applyButton, pressed && styles.applyButtonPressed]}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: 'hidden',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    handleContainer: {
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.divider,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    clearText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.accent,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    sectionHint: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textSubtle,
      marginBottom: spacing.md,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
      marginVertical: spacing.md,
    },
    optionGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    optionButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 18,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    optionButtonActive: {
      backgroundColor: colors.accentSecondarySubtle,
      borderColor: colors.accent,
      borderWidth: 1.5,
    },
    optionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    optionTextActive: {
      color: colors.textPrimary,
      fontWeight: '600',
    },

    // Mode toggle (radio buttons)
    modeToggle: {
      flexDirection: 'row',
      gap: spacing.lg,
    },
    modeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    modeButtonActive: {},
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    modeButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    modeButtonTextActive: {
      color: colors.textPrimary,
      fontWeight: '600',
    },

    // Topics
    topicsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    topicChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 16,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    topicChipActive: {
      backgroundColor: colors.accentSecondarySubtle,
      borderColor: colors.accent,
      borderWidth: 1.5,
    },
    topicText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    topicTextActive: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    topicCount: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textMuted,
      marginLeft: spacing.xs,
    },
    topicCountActive: {
      color: colors.textSecondary,
    },

    // Categories
    chipsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    categoryChip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 16,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    categoryChipActive: {
      backgroundColor: colors.accentSecondarySubtle,
      borderColor: colors.accent,
      borderWidth: 1.5,
    },
    categoryText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
    },
    categoryTextActive: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    selectionHint: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textSubtle,
      marginTop: spacing.sm,
    },

    // Publishers
    publisherChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 16,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    publisherChipActive: {
      backgroundColor: colors.accentSecondarySubtle,
      borderColor: colors.accent,
      borderWidth: 1.5,
    },
    publisherText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    publisherTextActive: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    publisherCount: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textMuted,
      marginLeft: spacing.xs,
    },
    publisherCountActive: {
      color: colors.textSecondary,
    },

    // Loading / Empty states
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    loadingText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
      marginLeft: spacing.sm,
    },
    emptyText: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textSubtle,
      paddingVertical: spacing.md,
    },

    // Apply button
    applyButton: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    applyButtonPressed: {
      opacity: 0.8,
    },
    applyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.surface,
    },
  });
}
