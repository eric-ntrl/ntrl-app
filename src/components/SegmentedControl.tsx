import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

type Segment<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  segments: Segment<T>[];
  selected: T;
  onSelect: (key: T) => void;
};

/**
 * Reusable segmented control component
 * Typographic style - no borders, no filled backgrounds
 * Active state indicated by weight/opacity only
 */
export default function SegmentedControl<T extends string>({
  segments,
  selected,
  onSelect,
}: Props<T>) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {segments.map((segment, index) => {
        const isSelected = segment.key === selected;
        const showSeparator = index < segments.length - 1;

        return (
          <View key={segment.key} style={styles.segmentWrapper}>
            <Pressable
              style={({ pressed }) => [styles.segment, pressed && styles.segmentPressed]}
              onPress={() => onSelect(segment.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={segment.label}
            >
              <Text style={[styles.segmentText, isSelected && styles.segmentTextSelected]}>
                {segment.label}
              </Text>
            </Pressable>
            {showSeparator && <Text style={styles.separator}>|</Text>}
          </View>
        );
      })}
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    segmentWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    segment: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    segmentPressed: {
      opacity: 0.5,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSubtle,
    },
    segmentTextSelected: {
      fontWeight: '600',
      color: colors.textMuted,
    },
    separator: {
      fontSize: 14,
      fontWeight: '300',
      color: colors.textSubtle,
      marginHorizontal: spacing.xs,
    },
  });
}
