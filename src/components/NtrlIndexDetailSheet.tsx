import React, { useMemo } from 'react';
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
import HorizontalSegmentedGauge from './HorizontalSegmentedGauge';
import { useTheme } from '../theme';
import type { Theme, ThemeColors } from '../theme/types';
import type { Transformation, SpanReason } from '../navigation/types';
import { SPAN_REASON_METADATA, SPAN_REASONS } from '../utils/taxonomy';
import { NTRL_INDEX_BANDS, getBandForScore } from '../utils/ntrlIndex';

/**
 * Get highlight color for a SpanReason from theme colors.
 */
function getSpanReasonHighlightColor(reason: SpanReason, colors: ThemeColors): string {
  const colorKey = SPAN_REASON_METADATA[reason].colorKey;
  return colors[colorKey as keyof ThemeColors] as string;
}

/**
 * Count transformations by SpanReason.
 */
function countBySpanReason(transformations: Transformation[]): Map<SpanReason, number> {
  const counts = new Map<SpanReason, number>();
  for (const t of transformations) {
    counts.set(t.reason, (counts.get(t.reason) || 0) + 1);
  }
  return counts;
}

/**
 * Find the primary concern (most frequent SpanReason).
 */
function getPrimaryConcern(counts: Map<SpanReason, number>): SpanReason | null {
  let maxCount = 0;
  let primary: SpanReason | null = null;

  for (const [reason, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      primary = reason;
    }
  }

  return primary;
}

type NtrlIndexDetailSheetProps = {
  visible: boolean;
  onClose: () => void;
  score: number;
  transformations: Transformation[];
};

/**
 * Detail sheet modal for NTRL Index.
 * Shows score breakdown, primary concern, and all detected patterns.
 */
export default function NtrlIndexDetailSheet({
  visible,
  onClose,
  score,
  transformations,
}: NtrlIndexDetailSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors, spacing } = theme;

  // Calculate sheet max height dynamically using reactive dimensions
  const sheetMaxHeight = windowHeight * 0.85;

  const clampedScore = Math.max(0, Math.min(100, score));
  const band = getBandForScore(clampedScore);

  // Count by SpanReason
  const reasonCounts = useMemo(() => countBySpanReason(transformations), [transformations]);
  const primaryConcern = useMemo(() => getPrimaryConcern(reasonCounts), [reasonCounts]);

  // Sort reasons by count (descending)
  const sortedReasons = useMemo(() => {
    return SPAN_REASONS.filter((reason) => (reasonCounts.get(reason) || 0) > 0).sort(
      (a, b) => (reasonCounts.get(b) || 0) - (reasonCounts.get(a) || 0)
    );
  }, [reasonCounts]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop - tap to close */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sheet content */}
        <View style={[styles.sheet, { maxHeight: sheetMaxHeight, minHeight: windowHeight * 0.6 }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(spacing.xxxl + insets.bottom, 48) },
            ]}
            showsVerticalScrollIndicator={true}
            bounces={true}
            scrollEnabled={true}
            alwaysBounceVertical={true}
          >
            {/* Handle bar */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Segmented gauge bar */}
            <HorizontalSegmentedGauge score={clampedScore} />

            {/* Score section */}
            <View style={styles.scoreSection}>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreText}>{clampedScore}</Text>
                <Text style={[styles.labelText, { color: band.color }]}>{band.label}</Text>
              </View>
              <Text style={styles.descriptionText}>{band.description}</Text>
            </View>

            {/* Primary concern section */}
            {primaryConcern && (
              <View style={styles.primarySection}>
                <Text style={styles.sectionTitle}>PRIMARY CONCERN</Text>
                <View style={styles.primaryCard}>
                  <View style={styles.primaryHeader}>
                    <View
                      style={[
                        styles.primarySwatch,
                        { backgroundColor: getSpanReasonHighlightColor(primaryConcern, colors) },
                      ]}
                    />
                    <Text style={styles.primaryName}>
                      {SPAN_REASON_METADATA[primaryConcern].fullName}
                    </Text>
                  </View>
                  <Text style={styles.primaryHarm}>
                    {SPAN_REASON_METADATA[primaryConcern].harmExplanation}
                  </Text>
                  <Text style={styles.primaryWhy}>
                    {SPAN_REASON_METADATA[primaryConcern].whyItMatters}
                  </Text>
                </View>
              </View>
            )}

            {/* Detected patterns section */}
            {sortedReasons.length > 0 && (
              <View style={styles.patternsSection}>
                <Text style={styles.sectionTitle}>CHANGES MADE</Text>
                <View style={styles.patternsList}>
                  {sortedReasons.map((reason) => (
                    <View key={reason} style={styles.patternRow}>
                      <View style={styles.patternLeft}>
                        <View
                          style={[
                            styles.patternSwatch,
                            { backgroundColor: getSpanReasonHighlightColor(reason, colors) },
                          ]}
                        />
                        <Text style={styles.patternName}>
                          {(() => {
                            const meta = SPAN_REASON_METADATA[reason];
                            const shortName = meta.shortName;
                            const harm =
                              meta.harmExplanation.charAt(0).toLowerCase() +
                              meta.harmExplanation.slice(1);
                            const isNoun = ['clickbait', 'selling', 'loaded verbs'].includes(
                              shortName.toLowerCase()
                            );
                            return isNoun
                              ? `${shortName} (${harm})`
                              : `${shortName} phrase (${harm})`;
                          })()}
                        </Text>
                      </View>
                      <Text style={styles.patternCount}>{reasonCounts.get(reason)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* How this works section */}
            <View style={styles.explanationSection}>
              <Text style={styles.sectionTitle}>HOW THIS WORKS</Text>
              <Text style={styles.explanationText}>
                The NTRL Index measures manipulation density — how many flagged phrases appear per
                100 words. A score of 0 means no manipulation detected. Higher scores indicate more
                manipulative language patterns.
              </Text>
              <View style={styles.scaleContainer}>
                {NTRL_INDEX_BANDS.map((band, index) => {
                  const rangeLabel =
                    index === 0 ? '0' : `${NTRL_INDEX_BANDS[index - 1].max + 1}-${band.max}`;
                  return (
                    <View key={band.label} style={styles.scaleRow}>
                      <View style={[styles.scaleDot, { backgroundColor: band.color }]} />
                      <Text style={styles.scaleLabel}>
                        {rangeLabel} {band.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Close button */}
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
      // maxHeight is now set inline using reactive useWindowDimensions
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      // paddingBottom is set inline with safe area insets
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
    scoreSection: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    scoreText: {
      fontSize: 48,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    labelText: {
      fontSize: 20,
      fontWeight: '600',
    },
    descriptionText: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSecondary,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    primarySection: {
      marginBottom: spacing.lg,
    },
    primaryCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.md,
    },
    primaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    primarySwatch: {
      width: 16,
      height: 16,
      borderRadius: 4,
    },
    primaryName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    primaryHarm: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    primaryWhy: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
      lineHeight: 18,
    },
    patternsSection: {
      marginBottom: spacing.lg,
    },
    patternsList: {
      gap: spacing.md,
    },
    patternRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: spacing.sm,
    },
    patternLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      flex: 1,
    },
    patternSwatch: {
      width: 14,
      height: 14,
      borderRadius: 3,
      marginTop: 2,
    },
    patternName: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    patternCount: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
      marginLeft: spacing.md,
    },
    explanationSection: {
      marginBottom: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    explanationText: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
      lineHeight: 18,
      marginBottom: spacing.md,
    },
    scaleContainer: {
      gap: spacing.xs,
    },
    scaleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    scaleDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    scaleLabel: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textMuted,
    },
    closeButton: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    closeButtonPressed: {
      opacity: 0.7,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textPrimary,
    },
  });
}
