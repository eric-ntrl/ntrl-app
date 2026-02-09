import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { useTheme } from '../theme';
import type { Theme, ThemeColors } from '../theme/types';
import { serifFamily } from '../theme/typography';
import type { Transformation, SpanReason, L1Category } from '../navigation/types';
import type { Item } from '../types';
import HorizontalSegmentedGauge from './HorizontalSegmentedGauge';
import NtrlIndexDetailSheet from './NtrlIndexDetailSheet';
import TransparencyDisclaimer from './TransparencyDisclaimer';
import HighlightTooltip from './HighlightTooltip';
import {
  mapSpanReasonToL1Category,
  L1_CATEGORY_METADATA,
  SPAN_REASON_METADATA,
  SPAN_REASONS,
} from '../utils/taxonomy';

/**
 * Get highlight color for an L1 category from theme colors.
 */
function getL1HighlightColor(category: L1Category, colors: ThemeColors): string {
  const colorKey = L1_CATEGORY_METADATA[category].colorKey;
  return colors[colorKey as keyof ThemeColors] as string;
}

/**
 * Get highlight color based on span reason, mapped through L1 category.
 */
function getHighlightColor(reason: SpanReason | undefined, colors: ThemeColors): string {
  if (!reason) {
    return colors.highlightFraming; // Default fallback
  }

  const l1Category = mapSpanReasonToL1Category(reason);
  return getL1HighlightColor(l1Category, colors);
}

/**
 * Count transformations by SpanReason (backend category).
 */
function countBySpanReason(transformations: Transformation[]): Map<SpanReason, number> {
  const counts = new Map<SpanReason, number>();
  for (const t of transformations) {
    counts.set(t.reason, (counts.get(t.reason) || 0) + 1);
  }
  return counts;
}

/**
 * Get highlight color for a SpanReason from theme colors.
 */
function getSpanReasonHighlightColor(reason: SpanReason, colors: ThemeColors): string {
  const colorKey = SPAN_REASON_METADATA[reason].colorKey;
  return colors[colorKey as keyof ThemeColors] as string;
}

/**
 * Segment data for highlighted text with tap info.
 */
type HighlightSegment = {
  text: string;
  highlighted: boolean;
  highlightColor?: string;
  reason?: SpanReason;
  replacement?: string;
};

/**
 * Render text with inline highlights + strikethrough — always ON (no toggle).
 * Supports tap handling for showing tooltips.
 */
function HighlightedText({
  text,
  transformations,
  styles,
  colors,
  textStyle,
  onSpanPress,
}: {
  text: string;
  transformations: Transformation[];
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  textStyle?: object;
  onSpanPress?: (reason: SpanReason, replacement: string | undefined, x: number, y: number) => void;
}) {
  if (!text) {
    return null;
  }

  const baseStyle = textStyle || styles.articleText;

  if (transformations.length === 0) {
    return <Text style={baseStyle}>{text}</Text>;
  }

  const sorted = [...transformations].sort((a, b) => a.start - b.start);

  const segments: HighlightSegment[] = [];
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
      reason: transform.reason,
      replacement: transform.filtered,
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
              styles.strikethrough,
              { backgroundColor: segment.highlightColor },
            ]}
            testID={`highlight-span-${index}`}
            onPress={
              onSpanPress && segment.reason
                ? (e) => {
                    const { pageX, pageY } = e.nativeEvent;
                    onSpanPress(segment.reason!, segment.replacement, pageX, pageY);
                  }
                : undefined
            }
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
 * Unified Original Article section with title and body
 */
function OriginalArticleSection({
  title,
  body,
  titleTransformations,
  bodyTransformations,
  styles,
  colors,
  onSpanPress,
}: {
  title: string;
  body: string;
  titleTransformations: Transformation[];
  bodyTransformations: Transformation[];
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  onSpanPress?: (reason: SpanReason, replacement: string | undefined, x: number, y: number) => void;
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
        onSpanPress={onSpanPress}
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
        onSpanPress={onSpanPress}
      />
    </View>
  );
}

/**
 * Change categories list - displays SpanReason categories with counts.
 * Shows the actual backend categories for more granular information.
 */
function ChangeCategories({
  transformations,
  styles,
  colors,
}: {
  transformations: Transformation[];
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  const reasonCounts = useMemo(() => countBySpanReason(transformations), [transformations]);

  // Sort categories by count (descending)
  const sortedReasons = useMemo(() => {
    return SPAN_REASONS.filter((reason) => (reasonCounts.get(reason) || 0) > 0).sort(
      (a, b) => (reasonCounts.get(b) || 0) - (reasonCounts.get(a) || 0)
    );
  }, [reasonCounts]);

  if (sortedReasons.length === 0) {
    return null;
  }

  return (
    <View style={styles.categoriesSection}>
      <Text style={styles.categoriesTitle}>Changes made</Text>
      <View style={styles.categoriesList}>
        {sortedReasons.map((reason) => (
          <View key={reason} style={styles.categoryRow}>
            <View style={styles.categoryLeft}>
              <View
                style={[
                  styles.categorySwatch,
                  { backgroundColor: getSpanReasonHighlightColor(reason, colors) },
                ]}
              />
              <Text style={styles.categoryLabel}>
                {(() => {
                  const meta = SPAN_REASON_METADATA[reason];
                  const shortName = meta.shortName;
                  const harm =
                    meta.harmExplanation.charAt(0).toLowerCase() + meta.harmExplanation.slice(1);
                  const isNoun = ['clickbait', 'selling', 'loaded verbs', 'quoting'].includes(
                    shortName.toLowerCase()
                  );
                  return isNoun ? `${shortName} (${harm})` : `${shortName} phrase (${harm})`;
                })()}
              </Text>
            </View>
            <Text style={styles.categoryCount}>{reasonCounts.get(reason)}</Text>
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
  /** Callback when info icon is pressed */
  onInfoPress?: () => void;
};

/**
 * Calculate NTRL Index (0-100 scale, higher = more polluted).
 * Uses phrases per 100 words as the density metric.
 */
function calculateNtrlIndex(spanCount: number, wordCount: number): number {
  if (spanCount === 0) return 0;
  if (wordCount === 0) return 0;

  // Density: flagged phrases per 100 words
  const phrasesPer100Words = (spanCount / wordCount) * 100;

  // More pessimistic sigmoid calibration:
  // 0 phrases/100w → 0 (clean)
  // 0.5 phrases/100w → ~15
  // 1.0 phrases/100w → ~35
  // 2.0 phrases/100w → ~60
  // 3.0 phrases/100w → ~75
  // 5.0+ phrases/100w → ~90+

  const midpoint = 1.5; // Lower = more pessimistic
  const steepness = 1.2;
  const ceiling = 95; // Higher ceiling for more range

  const x = steepness * (phrasesPer100Words - midpoint);
  const sigmoidValue = 1 / (1 + Math.exp(-x));
  return Math.round(sigmoidValue * ceiling);
}

/**
 * NtrlContent — inline transparency content for ArticleDetailScreen.
 * Shows TransparencyDisclaimer, HorizontalSegmentedGauge,
 * original article with highlighted+strikethrough text, category change list,
 * tap tooltips, and empty states.
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

  const [showDetailSheet, setShowDetailSheet] = useState(false);

  // Tooltip state
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipReason, setTooltipReason] = useState<SpanReason>('rhetorical_framing');
  const [tooltipReplacement, setTooltipReplacement] = useState<string | undefined>(undefined);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const hasContent = !!fullOriginalText;
  const allTransformations = [...titleTransformations, ...transformations];
  const hasChanges = allTransformations.length > 0;

  // Calculate word count from original text (title + body)
  const wordCount = useMemo(() => {
    let text = fullOriginalText || '';
    if (originalTitle) {
      text = originalTitle + ' ' + text;
    }
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    return words.length;
  }, [fullOriginalText, originalTitle]);

  // Calculate NTRL Index (0 = clean, 100 = polluted)
  const ntrlIndex = useMemo(() => {
    return calculateNtrlIndex(allTransformations.length, wordCount);
  }, [allTransformations.length, wordCount]);

  // Handle span tap to show tooltip
  const handleSpanPress = useCallback(
    (reason: SpanReason, replacement: string | undefined, x: number, y: number) => {
      setTooltipReason(reason);
      setTooltipReplacement(replacement);
      setTooltipPosition({ x, y });
      setTooltipVisible(true);
    },
    []
  );

  // Dismiss tooltip
  const dismissTooltip = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  return (
    <View testID="ntrl-view-screen">
      {hasContent ? (
        <>
          {/* 1. Transparency disclaimer at top */}
          <TransparencyDisclaimer variant="ntrl" />

          {/* 2. Horizontal segmented gauge (always shown, tappable) */}
          <View style={styles.gaugeSection}>
            <HorizontalSegmentedGauge score={ntrlIndex} onPress={() => setShowDetailSheet(true)} />
          </View>

          {/* 3. Unified Original Article section with title and body */}
          {originalTitle && fullOriginalText && (
            <OriginalArticleSection
              title={originalTitle}
              body={fullOriginalText}
              titleTransformations={titleTransformations}
              bodyTransformations={transformations}
              styles={styles}
              colors={colors}
              onSpanPress={handleSpanPress}
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
                onSpanPress={handleSpanPress}
              />
            </View>
          )}

          {/* 5. Change categories with L1 taxonomy (only when there are changes) */}
          {hasChanges && (
            <ChangeCategories
              transformations={allTransformations}
              styles={styles}
              colors={colors}
            />
          )}

          {/* 6. Tooltip overlay */}
          <HighlightTooltip
            visible={tooltipVisible}
            reason={tooltipReason}
            replacement={tooltipReplacement}
            position={tooltipPosition}
            onDismiss={dismissTooltip}
          />

          {/* 7. Detail sheet modal */}
          <NtrlIndexDetailSheet
            visible={showDetailSheet}
            onClose={() => setShowDetailSheet(false)}
            score={ntrlIndex}
            transformations={allTransformations}
          />
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

    // Gauge section
    gaugeSection: {
      alignItems: 'center',
      marginBottom: spacing.lg,
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
    strikethrough: {
      textDecorationLine: 'line-through',
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
      gap: spacing.md,
    },
    categoryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: spacing.sm,
    },
    categoryLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      flex: 1,
    },
    categorySwatch: {
      width: 14,
      height: 14,
      borderRadius: 3,
      marginTop: 2,
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
      marginLeft: spacing.md,
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
