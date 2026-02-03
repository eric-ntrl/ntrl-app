import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme/types';
import type { DateRangePreset } from '../../types/search';

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
  { key: '24h', label: 'Past 24 hours' },
  { key: 'week', label: 'Past week' },
  { key: 'month', label: 'Past month' },
  { key: 'all', label: 'All time' },
];

type SearchFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: {
    sort: 'relevance' | 'recency';
    dateRange: DateRangePreset;
    categories: string[];
  }) => void;
  // Current values
  sort: 'relevance' | 'recency';
  dateRange: DateRangePreset;
  selectedCategories: string[];
};

/**
 * Bottom sheet for sort and filter options.
 */
export default function SearchFilterSheet({
  visible,
  onClose,
  onApply,
  sort: initialSort,
  dateRange: initialDateRange,
  selectedCategories: initialCategories,
}: SearchFilterSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors, spacing } = theme;

  const sheetMaxHeight = windowHeight * 0.85;

  // Local state for editing
  const [sort, setSort] = useState<'relevance' | 'recency'>(initialSort);
  const [dateRange, setDateRange] = useState<DateRangePreset>(initialDateRange);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);

  // Reset local state when sheet opens
  React.useEffect(() => {
    if (visible) {
      setSort(initialSort);
      setDateRange(initialDateRange);
      setSelectedCategories(initialCategories);
    }
  }, [visible, initialSort, initialDateRange, initialCategories]);

  const handleCategoryToggle = useCallback((categoryKey: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryKey)
        ? prev.filter((c) => c !== categoryKey)
        : [...prev, categoryKey]
    );
  }, []);

  const handleClear = useCallback(() => {
    setSort('relevance');
    setDateRange('all');
    setSelectedCategories([]);
  }, []);

  const handleApply = useCallback(() => {
    onApply({ sort, dateRange, categories: selectedCategories });
    onClose();
  }, [onApply, onClose, sort, dateRange, selectedCategories]);

  const hasFilters = sort !== 'relevance' || dateRange !== 'all' || selectedCategories.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { maxHeight: sheetMaxHeight }]}>
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
                  style={[styles.optionButton, sort === 'relevance' && styles.optionButtonActive]}
                  onPress={() => setSort('relevance')}
                  accessibilityState={{ selected: sort === 'relevance' }}
                >
                  <Text
                    style={[styles.optionText, sort === 'relevance' && styles.optionTextActive]}
                  >
                    Relevance
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.optionButton, sort === 'recency' && styles.optionButtonActive]}
                  onPress={() => setSort('recency')}
                  accessibilityState={{ selected: sort === 'recency' }}
                >
                  <Text style={[styles.optionText, sort === 'recency' && styles.optionTextActive]}>
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

            {/* Categories section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CATEGORIES</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category.key);
                  return (
                    <Pressable
                      key={category.key}
                      style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                      onPress={() => handleCategoryToggle(category.key)}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text
                        style={[styles.categoryText, isSelected && styles.categoryTextActive]}
                      >
                        {category.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.categoryHint}>
                {selectedCategories.length === 0
                  ? 'All categories'
                  : `${selectedCategories.length} selected`}
              </Text>
            </View>

            {/* Apply button */}
            <Pressable
              style={({ pressed }) => [styles.applyButton, pressed && styles.applyButtonPressed]}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
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
      minHeight: 300,
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
    categoriesGrid: {
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
    categoryHint: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textSubtle,
      marginTop: spacing.sm,
    },
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
