import React, { useRef, useMemo, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { useTheme } from '../theme';
import { lightTap } from '../utils/haptics';
import type { Theme } from '../theme/types';

type SwipeableRowProps = {
  children: ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  enabled?: boolean;
};

/**
 * Swipeable row wrapper that reveals a "Remove" button on left swipe.
 * Uses muted red color to match NTRL's calm aesthetic.
 */
export default function SwipeableRow({
  children,
  onDelete,
  deleteLabel = 'Remove',
  enabled = true,
}: SwipeableRowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const swipeableRef = useRef<Swipeable>(null);

  const handleDelete = () => {
    lightTap();
    swipeableRef.current?.close();
    onDelete();
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionsContainer}>
        <Animated.View style={[styles.actionContainer, { transform: [{ translateX }] }]}>
          <RectButton
            style={styles.deleteButton}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel={deleteLabel}
          >
            <Text style={styles.deleteLabel}>{deleteLabel}</Text>
          </RectButton>
        </Animated.View>
      </View>
    );
  };

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    rightActionsContainer: {
      width: 80,
      flexDirection: 'row',
    },
    actionContainer: {
      flex: 1,
    },
    deleteButton: {
      flex: 1,
      backgroundColor: 'rgba(200, 120, 120, 0.15)', // Muted dusty rose matching highlightUrgency
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: 'rgb(180, 100, 100)', // Slightly darker dusty rose for text
    },
  });
}
