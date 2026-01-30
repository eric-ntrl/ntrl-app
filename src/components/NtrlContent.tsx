import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme';
import type { Theme, ThemeColors } from '../theme/types';
import { serifFamily } from '../theme/typography';
import type { TransformationType, Transformation, SpanReason } from '../navigation/types';
import type { Item } from '../types';
import ManipulationGauge from './ManipulationGauge';

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
  textStyle,
}: {
  text: string;
  transformations: Transformation[];
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  textStyle?: object;
}) {
  if (!text) {
    return null;
  }

  const baseStyle = textStyle || styles.articleText;

  if (transformations.length === 0) {
    return <Text style={baseStyle}>{text}</Text>;
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
    <Text style={baseStyle} testID="ntrl-view-text">
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
 * Unified Original Article section with title and body
 */
function OriginalArticleSection({
  title,
  body,
  titleTransformations,
  bodyTransformations,
  styles,
  colors,
}: {
  title: string;
  body: string;
  titleTransformations: Transformation[];
  bodyTransformations: Transformation[];
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.originalArticleContainer}>
      <Text style={styles.originalArticleLabel}>ORIGINAL ARTICLE</Text>

      {/* Title - prominent styling */}
      <HighlightedText
        text={title}
        transformations={titleTransformations}
        styles={styles}
        colors={colors}
        textStyle={styles.originalTitleText}
      />

      {/* Spacer between title and body */}
      <View style={styles.titleBodySpacer} />

      {/* Body - normal styling */}
      <HighlightedText
        text={body}
        transformations={bodyTransformations}
        styles={styles}
        colors={colors}
        textStyle={styles.articleText}
      />
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
  originalTitle?: string;
  transformations: Transformation[];
  titleTransformations?: Transformation[];
};

/**
 * Calculate integrity score using sigmoid curve.
 *
 * @param spanCount - Total number of manipulation spans
 * @param paragraphCount - Number of paragraphs in content
 * @returns Score from 0-100 (100 = clean, 0 = highly manipulative)
 */
function calculateIntegrityScore(spanCount: number, paragraphCount: number): number {
  if (spanCount === 0) return 100;
  if (paragraphCount === 0) return 100;

  const phrasesPerParagraph = spanCount / paragraphCount;

  // Sigmoid curve calibration:
  // 0.0 phrases/para → 100 (perfect)
  // 0.5 phrases/para → ~90 (clean)
  // 1.0 phrases/para → ~78 (acceptable)
  // 1.5 phrases/para → ~62 (concerning)
  // 2.0 phrases/para → ~44 (problematic)
  // 3.0+ phrases/para → <30 (highly manipulative)

  const midpoint = 1.2;  // Density where score ≈ 70
  const steepness = 1.8; // Curve sharpness
  const floor = 15;      // Minimum score

  const x = steepness * (phrasesPerParagraph - midpoint);
  const sigmoidValue = 1 / (1 + Math.exp(x));

  return Math.round(floor + sigmoidValue * (100 - floor));
}

/**
 * NtrlContent — inline transparency content for ArticleDetailScreen.
 * Shows original title with highlights, manipulation gauge, legend,
 * highlighted article text, change categories, and empty states.
 */
export default function NtrlContent({
  item,
  fullOriginalText,
  originalTitle,
  transformations,
  titleTransformations = [],
}: NtrlContentProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [showLegend, setShowLegend] = useState(false);

  const hasContent = !!fullOriginalText;
  const allTransformations = [...titleTransformations, ...transformations];
  const hasChanges = allTransformations.length > 0;

  // Calculate paragraph count from original text
  const paragraphCount = useMemo(() => {
    if (!fullOriginalText) return 1;
    const paragraphs = fullOriginalText.split(/\n\n+/).filter(p => p.trim().length > 0);
    return Math.max(1, paragraphs.length);
  }, [fullOriginalText]);

  // Calculate integrity score using sigmoid curve
  const integrityScore = useMemo(() => {
    return calculateIntegrityScore(allTransformations.length, paragraphCount);
  }, [allTransformations.length, paragraphCount]);

  // Calculate phrases per paragraph for display
  const phrasesPerParagraph = useMemo(() => {
    if (paragraphCount === 0) return '0.0';
    return (allTransformations.length / paragraphCount).toFixed(1);
  }, [allTransformations.length, paragraphCount]);

  // Show clean message only when score is exactly 100
  const showCleanMessage = integrityScore === 100;

  return (
    <View testID="ntrl-view-screen">
      {hasContent ? (
        <>
          {/* 1. Manipulation gauge */}
          {hasChanges && (
            <View style={styles.gaugeSection}>
              <ManipulationGauge
                score={integrityScore}
                phrasesPerParagraph={phrasesPerParagraph}
              />
            </View>
          )}

          {/* 2. Legend */}
          {hasChanges && (
            <HighlightLegend
              expanded={showLegend}
              onToggle={() => setShowLegend(!showLegend)}
              styles={styles}
              colors={colors}
            />
          )}

          {/* 3. Clean message BEFORE article (only when score = 100) */}
          {showCleanMessage && (
            <View style={styles.cleanMessageContainer}>
              <Text style={styles.cleanMessage}>No manipulation detected</Text>
            </View>
          )}

          {/* 4. Unified Original Article section with title and body */}
          {originalTitle && fullOriginalText && (
            <OriginalArticleSection
              title={originalTitle}
              body={fullOriginalText}
              titleTransformations={titleTransformations}
              bodyTransformations={transformations}
              styles={styles}
              colors={colors}
            />
          )}

          {/* Fallback: body only if no title */}
          {!originalTitle && fullOriginalText && (
            <View style={styles.originalArticleContainer}>
              <Text style={styles.originalArticleLabel}>ORIGINAL ARTICLE</Text>
              <HighlightedText
                text={fullOriginalText}
                transformations={transformations}
                styles={styles}
                colors={colors}
              />
            </View>
          )}

          {/* 5. Clean message AFTER article (only when score = 100) */}
          {showCleanMessage && (
            <View style={styles.cleanMessageContainer}>
              <Text style={styles.cleanMessage}>No manipulation detected</Text>
            </View>
          )}

          {/* 6. Change categories (only when there are changes) */}
          {hasChanges && <ChangeCategories transformations={allTransformations} styles={styles} />}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Original text unavailable</Text>
          <Text style={styles.emptySubtext}>
            The original article text has expired from storage.
          </Text>
        </View>
      )}

    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography, spacing, layout } = theme;

  return StyleSheet.create({
    // Original Article section (unified title + body)
    originalArticleContainer: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: spacing.md,
      marginVertical: spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.highlight,
    },
    originalArticleLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    originalTitleText: {
      fontSize: 18,
      fontFamily: serifFamily,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 26,
    },
    titleBodySpacer: {
      height: spacing.lg,
    },

    // Clean message (shown before/after article when score = 100)
    cleanMessageContainer: {
      alignItems: 'center',
      paddingVertical: spacing.md,
      marginVertical: spacing.sm,
    },
    cleanMessage: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },

    // Gauge section
    gaugeSection: {
      alignItems: 'center',
      marginBottom: spacing.lg,
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

    articleText: {
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
      fontFamily: serifFamily,
      color: typography.body.color,
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

  });
}
