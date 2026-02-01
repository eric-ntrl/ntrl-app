import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme/types';
import type { SpanReason } from '../../navigation/types';

type CategoryItem = {
  reason: SpanReason;
  count: number;
  label: string;
};

type Props = {
  categories: CategoryItem[];
  initialVisibleCount?: number;
};

// Color swatches for each category (matching NtrlContent highlight colors)
const CATEGORY_COLORS: Record<SpanReason, string> = {
  urgency_inflation: 'rgba(200, 120, 120, 0.6)',
  emotional_trigger: 'rgba(130, 160, 200, 0.6)',
  editorial_voice: 'rgba(160, 130, 180, 0.6)',
  agenda_signaling: 'rgba(160, 130, 180, 0.6)',
  clickbait: 'rgba(200, 160, 100, 0.6)',
  selling: 'rgba(200, 160, 100, 0.6)',
  rhetorical_framing: 'rgba(255, 200, 50, 0.6)',
};

/**
 * Category breakdown list showing span counts by reason.
 * Shows top categories with "Show all" expansion option.
 */
export default function CategoryBreakdownList({
  categories,
  initialVisibleCount = 4,
}: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [expanded, setExpanded] = useState(false);

  if (categories.length === 0) {
    return null;
  }

  const visibleCategories = expanded
    ? categories
    : categories.slice(0, initialVisibleCount);

  const hasMore = categories.length > initialVisibleCount;

  return (
    <View style={styles.container}>
      {visibleCategories.map((cat, index) => (
        <View key={cat.reason} style={styles.row}>
          <View style={styles.leftContent}>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: CATEGORY_COLORS[cat.reason] || theme.colors.accent },
              ]}
            />
            <Text style={styles.label}>{cat.label}</Text>
          </View>
          <Text style={styles.count}>{cat.count}</Text>
        </View>
      ))}

      {hasMore && !expanded && (
        <Pressable
          onPress={() => setExpanded(true)}
          style={({ pressed }) => [styles.showMore, pressed && styles.showMorePressed]}
          accessibilityRole="button"
          accessibilityLabel={`Show all ${categories.length} categories`}
        >
          <Text style={styles.showMoreText}>
            Show all categories ({categories.length - initialVisibleCount} more)
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      marginTop: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.dividerSubtle,
    },
    leftContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    colorSwatch: {
      width: 12,
      height: 12,
      borderRadius: 3,
      marginRight: spacing.md,
    },
    label: {
      fontSize: 15,
      fontWeight: '400',
      color: colors.textPrimary,
      flex: 1,
    },
    count: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textMuted,
      marginLeft: spacing.md,
    },
    showMore: {
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
    showMorePressed: {
      opacity: 0.5,
    },
    showMoreText: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSubtle,
    },
  });
}
