import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme/types';
import type { SearchSuggestion } from '../../types/search';
import type { RecentSearch } from '../../storage/types';

type SearchSuggestionsProps = {
  suggestions: SearchSuggestion[];
  recentSearches: RecentSearch[];
  query: string;
  onSuggestionPress: (suggestion: SearchSuggestion) => void;
  onRecentPress: (query: string) => void;
};

/**
 * Dropdown suggestions below search input.
 * Shows matching sections, publishers, and recent searches.
 * Limited to 8 total suggestions.
 */
export default function SearchSuggestions({
  suggestions,
  recentSearches,
  query,
  onSuggestionPress,
  onRecentPress,
}: SearchSuggestionsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Filter recent searches that match query
  const matchingRecent = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return recentSearches
      .filter((r) => r.query.toLowerCase().includes(q) || q.includes(r.query.toLowerCase()))
      .slice(0, 3);
  }, [query, recentSearches]);

  // Combine suggestions and recent, limit to 8
  const allSuggestions: Array<{ type: 'suggestion' | 'recent'; data: SearchSuggestion | RecentSearch }> =
    useMemo(() => {
      const items: Array<{ type: 'suggestion' | 'recent'; data: SearchSuggestion | RecentSearch }> = [];

      // Add API suggestions first (sections, publishers)
      for (const s of suggestions.slice(0, 5)) {
        items.push({ type: 'suggestion', data: s });
      }

      // Add matching recent searches
      for (const r of matchingRecent) {
        if (items.length >= 8) break;
        // Don't duplicate if same text
        const exists = items.some(
          (i) =>
            (i.type === 'suggestion' && (i.data as SearchSuggestion).label.toLowerCase() === r.query.toLowerCase()) ||
            (i.type === 'recent' && (i.data as RecentSearch).query.toLowerCase() === r.query.toLowerCase())
        );
        if (!exists) {
          items.push({ type: 'recent', data: r });
        }
      }

      return items.slice(0, 8);
    }, [suggestions, matchingRecent]);

  if (allSuggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {allSuggestions.map((item, index) => {
        if (item.type === 'suggestion') {
          const suggestion = item.data as SearchSuggestion;
          return (
            <Pressable
              key={`${suggestion.type}-${suggestion.value}`}
              style={({ pressed }) => [styles.suggestionItem, pressed && styles.itemPressed]}
              onPress={() => onSuggestionPress(suggestion)}
              accessibilityLabel={`${suggestion.label}${suggestion.count ? `, ${suggestion.count} articles` : ''}`}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{suggestion.type === 'section' ? '◎' : '◇'}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>{suggestion.label}</Text>
                <Text style={styles.type}>
                  {suggestion.type === 'section' ? 'Section' : 'Publisher'}
                </Text>
              </View>
              {suggestion.count != null && suggestion.count > 0 && (
                <Text style={styles.count}>{suggestion.count}</Text>
              )}
            </Pressable>
          );
        } else {
          const recent = item.data as RecentSearch;
          return (
            <Pressable
              key={`recent-${recent.query}`}
              style={({ pressed }) => [styles.suggestionItem, pressed && styles.itemPressed]}
              onPress={() => onRecentPress(recent.query)}
              accessibilityLabel={`Recent search: ${recent.query}`}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>↻</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>{recent.query}</Text>
                <Text style={styles.type}>Recent</Text>
              </View>
            </Pressable>
          );
        }
      })}
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    itemPressed: {
      backgroundColor: colors.dividerSubtle,
    },
    iconContainer: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    icon: {
      fontSize: 14,
      color: colors.textMuted,
    },
    textContainer: {
      flex: 1,
    },
    label: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    type: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textMuted,
      marginTop: 2,
    },
    count: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSubtle,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 8,
      overflow: 'hidden',
    },
  });
}
