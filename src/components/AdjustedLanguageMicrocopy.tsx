import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import type { CategoryCount } from '../utils/taxonomy';
import { SPAN_REASON_METADATA } from '../utils/taxonomy';

type AdjustedLanguageMicrocopyProps = {
  /** Non-zero category counts, sorted by count descending */
  categoryCounts: CategoryCount[];
  /** Callback when info icon is pressed */
  onInfoPress: () => void;
  /** Show "Article summarized for shorter reading." suffix (Brief view only) */
  showBriefSuffix?: boolean;
};

/**
 * Displays full breakdown of removed language by category.
 *
 * Uses consistent expanded format in both Brief and Full views:
 * "Neutralised article: 2 urgency phrases (creates artificial time pressure) and 1 emotional phrase (hijacks emotions) removed."
 *
 * Brief view adds suffix: "Article summarized for shorter reading."
 */
export default function AdjustedLanguageMicrocopy({
  categoryCounts,
  onInfoPress,
  showBriefSuffix,
}: AdjustedLanguageMicrocopyProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Don't render if no adjustments
  if (categoryCounts.length === 0) {
    return null;
  }

  // Helper to format list with Oxford comma and "and"
  const formatList = (parts: string[]): string => {
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
  };

  // Categories whose shortNames are already nouns (don't need "phrase/phrases" suffix)
  // vs adjectives that need "phrase/phrases" to make grammatical sense
  const nounCategories = new Set(['clickbait', 'selling', 'loaded verbs']);

  // Build the breakdown parts with expanded format (harm explanations)
  // Always use: "2 urgency phrases (...), 3 loaded verbs (...), 1 clickbait (...)"
  const breakdownParts = categoryCounts.map(({ reason, count }) => {
    const metadata = SPAN_REASON_METADATA[reason];
    const shortName = metadata.shortName.toLowerCase();
    const harm = metadata.harmExplanation.toLowerCase();
    if (nounCategories.has(shortName)) {
      // Noun category: "3 loaded verbs (harm)" or "1 clickbait (harm)"
      return `${count} ${shortName} (${harm})`;
    }
    // Adjective category: "2 urgency phrases (harm)" or "1 emotional phrase (harm)"
    const phraseWord = count === 1 ? 'phrase' : 'phrases';
    return `${count} ${shortName} ${phraseWord} (${harm})`;
  });

  // Build the suffix for Brief view
  const briefSuffix = showBriefSuffix ? ' Article summarized for shorter reading.' : '';

  return (
    <View style={styles.container}>
      {/* Main content row: text block + info icon */}
      <View style={styles.contentRow}>
        <Text style={styles.text}>
          Neutralised article: {formatList(breakdownParts)} removed.{briefSuffix}
        </Text>
        <Pressable
          onPress={onInfoPress}
          style={({ pressed }) => [styles.infoButton, pressed && styles.infoButtonPressed]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Learn more about language adjustments"
        >
          <Text style={styles.infoIcon}>i</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    // Content row with text block + info icon
    contentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start', // Align icon to top of multi-line text
      gap: spacing.xs,
    },
    text: {
      flex: 1,
      fontSize: 13,
      fontWeight: '400',
      fontStyle: 'italic',
      lineHeight: 18,
      color: colors.textMuted,
    },
    infoButton: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoButtonPressed: {
      opacity: 0.5,
    },
    infoIcon: {
      fontSize: 11,
      fontWeight: '600',
      fontStyle: 'italic',
      color: colors.textMuted,
    },
  });
}
