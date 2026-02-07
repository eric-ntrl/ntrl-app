import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import type { SpanReason } from '../navigation/types';
import { SPAN_REASON_METADATA } from '../utils/taxonomy';

type HighlightTooltipProps = {
  /** Whether the tooltip is visible */
  visible: boolean;
  /** The category of the highlighted span */
  reason: SpanReason;
  /** Optional replacement text for the highlighted phrase */
  replacement?: string;
  /** Position of the tooltip */
  position: { x: number; y: number };
  /** Callback when tooltip should dismiss */
  onDismiss: () => void;
};

const AUTO_DISMISS_MS = 3000;
const SCREEN_PADDING = 16;

/**
 * Floating tooltip shown on tap of highlighted span.
 * Shows category name + optional replacement text.
 * Auto-dismisses after timeout or on scroll.
 */
export default function HighlightTooltip({
  visible,
  reason,
  replacement,
  position,
  onDismiss,
}: HighlightTooltipProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get category metadata
  const metadata = SPAN_REASON_METADATA[reason];
  const categoryName = metadata?.shortName || 'Unknown';

  // Screen width for positioning constraints
  const screenWidth = Dimensions.get('window').width;

  // Calculate tooltip position (centered above tap point, clamped to screen)
  const tooltipWidth = 220;
  const arrowSize = 8;
  let tooltipLeft = position.x - tooltipWidth / 2;

  // Clamp to screen bounds
  if (tooltipLeft < SCREEN_PADDING) {
    tooltipLeft = SCREEN_PADDING;
  } else if (tooltipLeft + tooltipWidth > screenWidth - SCREEN_PADDING) {
    tooltipLeft = screenWidth - SCREEN_PADDING - tooltipWidth;
  }

  // Position above the tap point
  const tooltipTop = position.y - 50;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();

      // Set auto-dismiss timer
      dismissTimer.current = setTimeout(() => {
        onDismiss();
      }, AUTO_DISMISS_MS);
    } else {
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();

      // Clear any existing timer
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, [visible, onDismiss, opacity]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          left: tooltipLeft,
          top: tooltipTop,
          width: tooltipWidth,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.tooltip}>
        <Text style={styles.categoryText}>{categoryName}</Text>
        {replacement && replacement.length > 0 && (
          <Text style={styles.replacementText}>Replaced with: "{replacement}"</Text>
        )}
      </View>
      {/* Arrow pointing down */}
      <View style={styles.arrowContainer}>
        <View style={styles.arrow} />
      </View>
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      position: 'absolute',
      zIndex: 1000,
    },
    tooltip: {
      backgroundColor: colors.textPrimary,
      borderRadius: 8,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    categoryText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.background,
    },
    replacementText: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.background,
      opacity: 0.8,
      marginTop: spacing.xs,
    },
    arrowContainer: {
      alignItems: 'center',
    },
    arrow: {
      width: 0,
      height: 0,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderTopWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: colors.textPrimary,
    },
  });
}
