import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useTheme } from '../theme';
import type { Theme, ThemeColors } from '../theme/types';
import { serifFamily } from '../theme/typography';
import { decodeHtmlEntities } from '../utils/text';
import { openExternalUrl } from '../utils/links';
import type { TransformationType, Transformation, SpanReason } from '../navigation/types';
import type { Item } from '../types';

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
 * Get highlight color based on span reason
 */
function getHighlightColor(reason: SpanReason | undefined, colors: ThemeColors): string {
  if (!reason) {
    return colors.highlight;
  }

  switch (reason) {
    case 'urgency_inflation':
      return colors.highlightUrgency;
    case 'emotional_trigger':
      return colors.highlightEmotional;
    case 'editorial_voice':
    case 'agenda_signaling':
      return colors.highlightEditorial;
    case 'clickbait':
    case 'selling':
      return colors.highlightClickbait;
    case 'rhetorical_framing':
    default:
      return colors.highlight;
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

/**
 * Legend item data for highlight colors
 */
const LEGEND_ITEMS = [
  { label: 'Emotional language', colorKey: 'highlightEmotional' as const },
  { label: 'Urgency/hype', colorKey: 'highlightUrgency' as const },
  { label: 'Editorial opinion', colorKey: 'highlightEditorial' as const },
  { label: 'Clickbait/selling', colorKey: 'highlightClickbait' as const },
];

/**
 * Render text with inline highlights — always ON (no toggle).
 */
function HighlightedText({
  text,
  transformations,
  styles,
  colors,
}: {
  text: string;
  transformations: Transformation[];
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  if (!text) {
    return null;
  }

  if (transformations.length === 0) {
    return <Text style={styles.articleText}>{text}</Text>;
  }

  const sorted = [...transformations].sort((a, b) => a.start - b.start);

  const segments: Array<{
    text: string;
    highlighted: boolean;
    highlightColor?: string;
  }> = [];
  let currentPos = 0;

  for (const transform of sorted) {
    if (transform.start < currentPos || transform.start >= text.length) {
      continue;
    }

    if (transform.start > currentPos) {
      segments.push({
        text: text.substring(currentPos, transform.start),
        highlighted: false,
      });
    }

    const endPos = Math.min(transform.end, text.length);
    segments.push({
      text: text.substring(transform.start, endPos),
      highlighted: true,
      highlightColor: getHighlightColor(transform.reason, colors),
    });
    currentPos = endPos;
  }

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
          <Text
            key={index}
            style={[
              styles.highlightedSpan,
              { backgroundColor: segment.highlightColor }
            ]}
            testID={`highlight-span-${index}`}
          >
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
 * Collapsible legend explaining highlight colors
 */
function HighlightLegend({
  expanded,
  onToggle,
  styles,
  colors,
}: {
  expanded: boolean;
  onToggle: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.legendContainer}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.legendToggle, pressed && styles.legendTogglePressed]}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Hide color legend' : 'Show color legend'}
      >
        <Text style={styles.legendToggleText}>
          {expanded ? '▾' : '▸'} What do colors mean?
        </Text>
      </Pressable>
      {expanded && (
        <View style={styles.legendContent}>
          {LEGEND_ITEMS.map((item) => (
            <View key={item.colorKey} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors[item.colorKey] }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
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

type NtrlContentProps = {
  item: Item;
  fullOriginalText: string | null | undefined;
  transformations: Transformation[];
};

/**
 * NtrlContent — inline transparency content for ArticleDetailScreen.
 * Shows intro text, headline, badge row, legend, highlighted text,
 * change categories, clean article notice, empty state, footer, and source error modal.
 */
export default function NtrlContent({ item, fullOriginalText, transformations }: NtrlContentProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [showLegend, setShowLegend] = useState(false);
  const [showSourceError, setShowSourceError] = useState(false);

  const hasContent = !!fullOriginalText;
  const hasChanges = transformations.length > 0;

  const handleViewSource = async () => {
    const success = await openExternalUrl(item.url, item.source_url);
    if (!success) {
      setShowSourceError(true);
    }
  };

  return (
    <View testID="ntrl-view-screen">
      {/* Calm intro */}
      <Text style={styles.intro}>
        This shows how ntrl adjusted language while preserving the facts.
      </Text>

      {/* Article headline for context */}
      <Text style={styles.articleHeadline}>{decodeHtmlEntities(item.headline)}</Text>

      {hasContent ? (
        <>
          {/* Badge + legend (always visible when changes exist) */}
          {hasChanges && (
            <>
              <View style={styles.badgeRow}>
                <View style={styles.highlightBadge}>
                  <Text style={styles.badgeText}>
                    {transformations.length} phrase{transformations.length !== 1 ? 's' : ''} flagged
                  </Text>
                </View>
              </View>
              <HighlightLegend
                expanded={showLegend}
                onToggle={() => setShowLegend(!showLegend)}
                styles={styles}
                colors={colors}
              />
            </>
          )}

          {/* Full article text with highlights (always ON) */}
          <View style={styles.articleSection}>
            <HighlightedText
              text={fullOriginalText!}
              transformations={transformations}
              styles={styles}
              colors={colors}
            />
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
    // Intro
    intro: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 22,
      color: colors.textMuted,
      marginBottom: spacing.xl,
    },

    // Article headline (serif)
    articleHeadline: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
      fontFamily: serifFamily,
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },

    // Badge row
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
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

    // Highlight legend
    legendContainer: {
      marginBottom: spacing.lg,
    },
    legendToggle: {
      paddingVertical: spacing.sm,
    },
    legendTogglePressed: {
      opacity: 0.5,
    },
    legendToggleText: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
    },
    legendContent: {
      marginTop: spacing.sm,
      paddingLeft: spacing.md,
      gap: spacing.xs,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    legendSwatch: {
      width: 14,
      height: 14,
      borderRadius: 2,
    },
    legendLabel: {
      fontSize: 13,
      fontWeight: '400',
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
      fontFamily: serifFamily,
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
      fontFamily: serifFamily,
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
