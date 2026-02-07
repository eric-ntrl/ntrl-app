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
import { useTheme } from '../theme';
import type { Theme, ThemeColors } from '../theme/types';
import { SPAN_REASON_METADATA, SPAN_REASONS } from '../utils/taxonomy';
import type { SpanReason } from '../navigation/types';

type InfoModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Get highlight color for a SpanReason from theme colors.
 */
function getSpanReasonHighlightColor(reason: SpanReason, colors: ThemeColors): string {
  const colorKey = SPAN_REASON_METADATA[reason].colorKey;
  return colors[colorKey as keyof ThemeColors] as string;
}

/**
 * Bottom sheet modal explaining NTRL's adjustment categories.
 * Uses SPAN_REASON_METADATA.whyItMatters for detailed explanations.
 */
export default function InfoModal({ visible, onClose }: InfoModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors, spacing } = theme;

  const sheetMaxHeight = windowHeight * 0.85;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop - tap to close */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sheet content */}
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

            {/* Title */}
            <Text style={styles.title}>What we adjust</Text>
            <Text style={styles.subtitle}>
              NTRL identifies and removes these types of manipulative language:
            </Text>

            {/* Category list */}
            <View style={styles.categoryList}>
              {SPAN_REASONS.map((reason) => {
                const meta = SPAN_REASON_METADATA[reason];
                return (
                  <View key={reason} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <View
                        style={[
                          styles.categorySwatch,
                          { backgroundColor: getSpanReasonHighlightColor(reason, colors) },
                        ]}
                      />
                      <Text style={styles.categoryName}>{meta.fullName}</Text>
                    </View>
                    <Text style={styles.categoryDescription}>{meta.whyItMatters}</Text>
                  </View>
                );
              })}
            </View>

            {/* Close button */}
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Got it</Text>
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
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    categoryList: {
      gap: spacing.lg,
      marginBottom: spacing.xl,
    },
    categoryItem: {
      gap: spacing.xs,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    categorySwatch: {
      width: 14,
      height: 14,
      borderRadius: 3,
    },
    categoryName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    categoryDescription: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
      lineHeight: 18,
      paddingLeft: 22, // Align with text after swatch
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
