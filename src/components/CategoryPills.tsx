import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { selectionTap } from '../utils/haptics';

export type CategoryPillsProps = {
  categories: Array<{ key: string; title: string }>;
  onPillPress: (key: string) => void;
  activeKey?: string | null;
};

/**
 * Horizontal scrollable row of category pills.
 * Used on Sections screen to provide quick navigation to each section.
 */
export function CategoryPills({ categories, onPillPress, activeKey }: CategoryPillsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <Pressable
            key={category.key}
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
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing, layout } = theme;

  return StyleSheet.create({
    container: {
      marginBottom: spacing.md,
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
      backgroundColor: colors.dividerSubtle,
      borderColor: colors.accent,
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
  });
}

export default CategoryPills;
