import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Switch, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { decodeHtmlEntities } from '../utils/text';
import { openExternalUrl } from '../utils/links';
import type { NtrlViewScreenProps, TransformationType, Transformation } from '../navigation/types';

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
    <Text style={styles.articleText} testID="ntrl-view-text">
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <Text key={index} style={styles.highlightedSpan} testID={`highlight-span-${index}`}>
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

export default function NtrlViewScreen({ route, navigation }: NtrlViewScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { item, fullOriginalText, transformations = [] } = route.params;

  // Debug logging
  console.log('[NtrlView] Received data:', {
    itemId: item.id,
    fullOriginalTextLength: fullOriginalText?.length || 0,
    transformationsCount: transformations.length,
    transformations: transformations.slice(0, 3).map(t => ({ start: t.start, end: t.end, original: t.original?.substring(0, 30) })),
  });

  const [showHighlights, setShowHighlights] = useState(true);
  const [showSourceError, setShowSourceError] = useState(false);

  const hasContent = !!fullOriginalText;
  const hasChanges = transformations.length > 0;

  // Handle external source link with error fallback
  const handleViewSource = async () => {
    const success = await openExternalUrl(item.url, item.source_url);
    if (!success) {
      setShowSourceError(true);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="ntrl-view-screen">
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
            {/* Highlights toggle with count badge */}
            {hasChanges && (
              <View style={styles.toggleRow} testID="highlight-toggle-row">
                <View style={styles.toggleLabelRow}>
                  <Text style={styles.toggleLabel}>Show highlights</Text>
                  {showHighlights && (
                    <View style={styles.highlightBadge}>
                      <Text style={styles.badgeText}>
                        {transformations.length} phrase{transformations.length !== 1 ? 's' : ''} flagged
                      </Text>
                    </View>
                  )}
                </View>
                <Switch
                  testID="highlight-toggle"
                  value={showHighlights}
                  onValueChange={setShowHighlights}
                  trackColor={{ false: colors.divider, true: colors.accent }}
                  thumbColor={colors.background}
                  ios_backgroundColor={colors.divider}
                />
              </View>
            )}

            {/* Full article text with highlights */}
            <View style={[
              styles.articleSection,
              hasChanges && !showHighlights && styles.articleSectionDimmed
            ]}>
              <HighlightedText
                text={fullOriginalText!}
                transformations={transformations}
                showHighlights={showHighlights}
                styles={styles}
              />
              {/* Indicator when highlights are hidden */}
              {hasChanges && !showHighlights && (
                <Text style={styles.highlightsHiddenHint}>
                  Toggle "Show highlights" to see what was flagged
                </Text>
              )}
            </View>

            {/* Change categories */}
            {hasChanges && <ChangeCategories transformations={transformations} styles={styles} />}

            {/* Clean article notice */}
            {!hasChanges && (
              <View style={styles.cleanArticle}>
                <Text style={styles.cleanText}>No manipulation detected</Text>
                <Text style={styles.cleanSubtext}>
                  This article appears to be written in neutral language.
                </Text>
              </View>
            )}
          </>
        ) : (
          /* Original text unavailable */
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Original text unavailable</Text>
            <Text style={styles.emptySubtext}>
              The original article text has expired from storage.
            </Text>
          </View>
        )}

        {/* Source attribution with link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Source: {item.source}</Text>
          <Pressable
            style={({ pressed }) => [styles.footerLink, pressed && styles.footerLinkPressed]}
            onPress={handleViewSource}
          >
            <Text style={styles.footerLinkText}>View original article →</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Source error modal */}
      <Modal visible={showSourceError} transparent animationType="fade" onRequestClose={() => setShowSourceError(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Source unavailable</Text>
            <Text style={styles.modalBody}>
              This link couldn't be opened. You can try again later.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.modalButton, pressed && styles.modalButtonPressed]}
              onPress={() => setShowSourceError(false)}
            >
              <Text style={styles.modalButtonText}>Go back</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    toggleLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    toggleLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    highlightBadge: {
      backgroundColor: colors.highlight,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 4,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textPrimary,
    },

    // Article section
    articleSection: {
      marginBottom: spacing.xxl,
    },
    articleSectionDimmed: {
      opacity: 0.7,
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
    highlightsHiddenHint: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
      fontStyle: 'italic',
      marginTop: spacing.md,
      textAlign: 'center',
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

    // Clean article notice
    cleanArticle: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xl,
      alignItems: 'center',
    },
    cleanText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    cleanSubtext: {
      fontSize: 13,
      fontWeight: '400',
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
      alignItems: 'center',
    },
    footerText: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textSubtle,
      marginBottom: spacing.md,
    },
    footerLink: {
      paddingVertical: spacing.sm,
    },
    footerLinkPressed: {
      opacity: 0.5,
    },
    footerLinkText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: layout.screenPadding,
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.xxl,
      width: '100%',
      maxWidth: 320,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    modalBody: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
      textAlign: 'center',
    },
    modalButton: {
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    modalButtonPressed: {
      opacity: 0.5,
    },
    modalButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textMuted,
    },
  });
}
