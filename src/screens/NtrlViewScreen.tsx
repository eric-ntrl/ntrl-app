import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { decodeHtmlEntities } from '../utils/text';
import type { Item } from '../types';

/**
 * Transformation types - categories of changes made by NTRL
 */
type TransformationType =
  | 'urgency'
  | 'emotional'
  | 'clickbait'
  | 'sensational'
  | 'opinion'
  | 'other';

/**
 * A single transformation/change made to the article
 */
type Transformation = {
  start: number;
  end: number;
  type: TransformationType;
  original: string;
  filtered: string;
};

type Props = {
  route: {
    params: {
      item: Item;
      fullOriginalText?: string | null;
      fullFilteredText?: string | null;
      transformations?: Transformation[];
    };
  };
  navigation: any;
};

/**
 * Get human-readable label for transformation type
 */
function getTypeLabel(type: TransformationType): string {
  switch (type) {
    case 'urgency':
      return 'Urgency language';
    case 'emotional':
      return 'Emotional triggers';
    case 'clickbait':
      return 'Clickbait phrases';
    case 'sensational':
      return 'Sensational wording';
    case 'opinion':
      return 'Opinion as fact';
    case 'other':
    default:
      return 'Other adjustments';
  }
}

/**
 * Count transformations by type
 */
function countByType(transformations: Transformation[]): Map<TransformationType, number> {
  const counts = new Map<TransformationType, number>();
  for (const t of transformations) {
    counts.set(t.type, (counts.get(t.type) || 0) + 1);
  }
  return counts;
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
      <Text style={styles.headerTitle}>ntrl view</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

/**
 * Render text with inline highlights for transformations
 */
function HighlightedText({
  text,
  transformations,
  showHighlights,
  styles,
}: {
  text: string;
  transformations: Transformation[];
  showHighlights: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  if (!text) {
    return null;
  }

  if (!showHighlights || transformations.length === 0) {
    return <Text style={styles.articleText}>{text}</Text>;
  }

  // Sort transformations by start position
  const sorted = [...transformations].sort((a, b) => a.start - b.start);

  // Build segments with highlights
  const segments: Array<{ text: string; highlighted: boolean }> = [];
  let currentPos = 0;

  for (const transform of sorted) {
    // Skip invalid ranges
    if (transform.start < currentPos || transform.start >= text.length) {
      continue;
    }

    // Add non-highlighted segment before this transformation
    if (transform.start > currentPos) {
      segments.push({
        text: text.substring(currentPos, transform.start),
        highlighted: false,
      });
    }

    // Add highlighted segment
    const endPos = Math.min(transform.end, text.length);
    segments.push({
      text: text.substring(transform.start, endPos),
      highlighted: true,
    });
    currentPos = endPos;
  }

  // Add remaining non-highlighted text
  if (currentPos < text.length) {
    segments.push({
      text: text.substring(currentPos),
      highlighted: false,
    });
  }

  return (
    <Text style={styles.articleText}>
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <Text key={index} style={styles.highlightedSpan}>
            {segment.text}
          </Text>
        ) : (
          <Text key={index}>{segment.text}</Text>
        )
      )}
    </Text>
  );
}

/**
 * Change categories list
 */
function ChangeCategories({
  transformations,
  styles,
}: {
  transformations: Transformation[];
  styles: ReturnType<typeof createStyles>;
}) {
  const typeCounts = useMemo(() => countByType(transformations), [transformations]);

  if (typeCounts.size === 0) {
    return null;
  }

  return (
    <View style={styles.categoriesSection}>
      <Text style={styles.categoriesTitle}>Changes made</Text>
      <View style={styles.categoriesList}>
        {Array.from(typeCounts.entries()).map(([type, count]) => (
          <View key={type} style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>{getTypeLabel(type)}</Text>
            <Text style={styles.categoryCount}>{count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function NtrlViewScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { item, fullOriginalText, transformations = [] } = route.params;

  const [showHighlights, setShowHighlights] = useState(true);

  const hasContent = !!fullOriginalText;
  const hasChanges = transformations.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Header onBack={() => navigation.goBack()} styles={styles} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calm intro */}
        <Text style={styles.intro}>
          This shows how ntrl adjusted language while preserving the facts.
        </Text>

        {/* Article headline for context */}
        <Text style={styles.articleHeadline}>{decodeHtmlEntities(item.headline)}</Text>

        {hasContent ? (
          <>
            {/* Highlights toggle */}
            {hasChanges && (
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Show highlights</Text>
                <Switch
                  value={showHighlights}
                  onValueChange={setShowHighlights}
                  trackColor={{ false: colors.divider, true: colors.accent }}
                  thumbColor={colors.background}
                  ios_backgroundColor={colors.divider}
                />
              </View>
            )}

            {/* Full article text with highlights */}
            <View style={styles.articleSection}>
              <HighlightedText
                text={fullOriginalText!}
                transformations={transformations}
                showHighlights={showHighlights}
                styles={styles}
              />
            </View>

            {/* Change categories */}
            {hasChanges && <ChangeCategories transformations={transformations} styles={styles} />}

            {/* No changes notice */}
            {!hasChanges && (
              <View style={styles.noChangesNotice}>
                <Text style={styles.noChangesText}>No changes were needed for this article.</Text>
              </View>
            )}
          </>
        ) : (
          /* Empty state */
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No changes to show.</Text>
            <Text style={styles.emptySubtext}>
              The full article text is not available for verification.
            </Text>
          </View>
        )}

        {/* Source attribution */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Source: {item.source}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing, layout } = theme;

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

    // Scroll content
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxxl,
    },

    // Intro
    intro: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 22,
      color: colors.textMuted,
      marginBottom: spacing.xl,
    },

    // Article headline
    articleHeadline: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },

    // Toggle row
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      marginBottom: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    toggleLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },

    // Article section
    articleSection: {
      marginBottom: spacing.xxl,
    },
    articleText: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 26,
      color: colors.textPrimary,
    },
    highlightedSpan: {
      backgroundColor: colors.highlight,
      borderRadius: 2,
    },

    // Categories section
    categoriesSection: {
      marginBottom: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    categoriesTitle: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.5,
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginBottom: spacing.md,
    },
    categoriesList: {
      gap: spacing.sm,
    },
    categoryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    categoryLabel: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    categoryCount: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
    },

    // No changes notice
    noChangesNotice: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xl,
    },
    noChangesText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
      textAlign: 'center',
    },

    // Empty state
    emptyState: {
      paddingVertical: spacing.xxxl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    emptySubtext: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSubtle,
      textAlign: 'center',
    },

    // Footer
    footer: {
      marginTop: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    footerText: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textSubtle,
    },
  });
}
