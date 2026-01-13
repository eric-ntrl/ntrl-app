import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

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
  return (
    <View style={styles.container}>
      {segments.map((segment, index) => {
        const isSelected = segment.key === selected;
        const showSeparator = index < segments.length - 1;

        return (
          <View key={segment.key} style={styles.segmentWrapper}>
            <Pressable
              style={({ pressed }) => [
                styles.segment,
                pressed && styles.segmentPressed,
              ]}
              onPress={() => onSelect(segment.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={segment.label}
            >
              <Text
                style={[
                  styles.segmentText,
                  isSelected && styles.segmentTextSelected,
                ]}
              >
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segment: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  segmentPressed: {
    opacity: 0.5,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSubtle,
  },
  segmentTextSelected: {
    fontWeight: '600',
    color: colors.textMuted,
  },
  separator: {
    fontSize: 13,
    fontWeight: '300',
    color: colors.textSubtle,
    marginHorizontal: spacing.xs,
  },
});
