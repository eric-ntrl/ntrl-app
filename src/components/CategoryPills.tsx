import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { selectionTap } from '../utils/haptics';

export type CategoryPillsProps = {
  categories: Array<{ key: string; title: string }>;
  onPillPress: (key: string) => void;
  activeKey?: string | null;
  label?: string; // e.g., "SECTIONS"
  sublabel?: string; // e.g., date string
};

/**
 * Horizontal scrollable row of category pills.
 * Used on Sections screen to provide quick navigation to each section.
 * Features edge fades to indicate scrollable content and optional label/sublabel row.
 */
export function CategoryPills({ categories, onPillPress, activeKey, label, sublabel }: CategoryPillsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const pillPositions = useRef<Map<string, { x: number; width: number }>>(new Map());
  const scrollViewWidth = useRef<number>(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setShowLeftFade(contentOffset.x > 10);
    setShowRightFade(contentOffset.x < contentSize.width - layoutMeasurement.width - 10);
  };

  // Auto-scroll to keep active pill visible
  useEffect(() => {
    if (!activeKey || !scrollViewRef.current) return;

    const pillPos = pillPositions.current.get(activeKey);
    if (!pillPos) return;

    const viewWidth = scrollViewWidth.current;
    if (viewWidth === 0) return;

    // Center the active pill in the scroll view
    const targetX = pillPos.x - (viewWidth / 2) + (pillPos.width / 2);
    const scrollX = Math.max(0, targetX);

    scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
  }, [activeKey]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {(label || sublabel) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {label && sublabel && <Text style={styles.label}> • </Text>}
          {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        </View>
      )}
      <View style={styles.scrollContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onLayout={(event: LayoutChangeEvent) => {
            scrollViewWidth.current = event.nativeEvent.layout.width;
          }}
        >
          {categories.map((category) => (
            <Pressable
              key={category.key}
              onLayout={(event: LayoutChangeEvent) => {
                const { x, width } = event.nativeEvent.layout;
                pillPositions.current.set(category.key, { x, width });
              }}
              style={({ pressed }) => [
                styles.pill,
                category.key === activeKey && styles.pillActive,
                pressed && styles.pillPressed,
              ]}
              onPress={() => {
                selectionTap();
                onPillPress(category.key);
              }}
            >
              <Text style={[
                styles.pillText,
                category.key === activeKey && styles.pillTextActive,
              ]}>
                {category.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {showLeftFade && <View style={styles.edgeFadeLeft} pointerEvents="none" />}
        {showRightFade && <View style={styles.edgeFadeRight} pointerEvents="none" />}
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing, layout } = theme;

  return StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      paddingHorizontal: layout.screenPadding,
      marginBottom: spacing.md,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 2,
      color: colors.textSubtle,
    },
    sublabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 2,
      color: colors.textSubtle,
      textTransform: 'uppercase',
    },
    scrollContainer: {
      position: 'relative',
    },
    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      gap: spacing.sm,
    },
    pill: {
      backgroundColor: colors.surface,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    pillPressed: {
      opacity: 0.7,
      backgroundColor: colors.dividerSubtle,
    },
    pillActive: {
      backgroundColor: colors.accentSecondarySubtle,
      borderColor: colors.accent,
      borderWidth: 1.5,
    },
    pillText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
    },
    pillTextActive: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    edgeFadeLeft: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 24,
      backgroundColor: colors.background,
      opacity: 0.9,
    },
    edgeFadeRight: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: 24,
      backgroundColor: colors.background,
      opacity: 0.9,
    },
  });
}

export default CategoryPills;
