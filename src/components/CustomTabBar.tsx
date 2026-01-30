import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { selectionTap } from '../utils/haptics';
import type { Theme, TextSizePreference } from '../theme/types';

/**
 * Pre-computed sizing values for each text size preference.
 * Keeps tab bar compact while maintaining accessibility.
 */
const TAB_BAR_SIZING: Record<TextSizePreference, {
  iconSize: number;
  labelFontSize: number;
  containerPaddingTop: number;
  tabPaddingVertical: number;
  tabMinHeight: number;
}> = {
  small: {
    iconSize: 22,
    labelFontSize: 10,
    containerPaddingTop: 3,
    tabPaddingVertical: 2,
    tabMinHeight: 36,
  },
  medium: {
    iconSize: 24,
    labelFontSize: 11,
    containerPaddingTop: 4,
    tabPaddingVertical: 2,
    tabMinHeight: 40,
  },
  large: {
    iconSize: 26,
    labelFontSize: 12,
    containerPaddingTop: 5,
    tabPaddingVertical: 3,
    tabMinHeight: 44,
  },
};

/**
 * Custom tab bar with enhanced haptics, press feedback, and active state indicator.
 * Maintains NTRL's calm aesthetic while providing clear visual hierarchy.
 */
export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { theme, textSize } = useTheme();
  const sizing = TAB_BAR_SIZING[textSize];
  const styles = useMemo(() => createStyles(theme, sizing), [theme, sizing]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          selectionTap();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={({ pressed }) => [
              styles.tab,
              isFocused && styles.tabActive,
              pressed && styles.tabPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={options.tabBarAccessibilityLabel}
          >
            <View style={{ height: sizing.iconSize, justifyContent: 'center', alignItems: 'center' }}>
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? theme.colors.accent : theme.colors.textMuted,
                size: sizing.iconSize,
              })}
            </View>
            <Text
              style={[styles.label, isFocused && styles.labelActive]}
              numberOfLines={1}
            >
              {typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : options.title ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(
  theme: Theme,
  sizing: typeof TAB_BAR_SIZING[TextSizePreference]
) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      paddingTop: sizing.containerPaddingTop,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: sizing.tabPaddingVertical,
      paddingHorizontal: spacing.sm,
      marginHorizontal: spacing.xs,
      borderRadius: 12,
      minHeight: sizing.tabMinHeight,
    },
    tabActive: {
      backgroundColor: colors.tabBarActiveBackground,
      transform: [{ scale: 1.02 }],
    },
    tabPressed: {
      opacity: 0.6,
    },
    label: {
      fontSize: sizing.labelFontSize,
      fontWeight: '400',
      color: colors.textMuted,
      marginTop: 1,
    },
    labelActive: {
      fontWeight: '600',
      color: colors.accent,
    },
  });
}
