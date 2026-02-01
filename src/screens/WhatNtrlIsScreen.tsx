import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import type { Theme, ColorMode } from '../theme/types';

interface WhatNtrlIsScreenProps {
  onComplete: () => void;
}

/**
 * First-run splash screen — minimalist "book title page" design.
 * Shown only once on first app launch, auto-transitions after 1.5 seconds.
 */
export default function WhatNtrlIsScreen({ onComplete }: WhatNtrlIsScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Auto-transition timer (600ms fade-in + 1900ms hold = 2500ms total)
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Gradient colors based on color mode
  const gradientColors = useMemo(
    () => getGradientColors(colorMode),
    [colorMode]
  );

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <StatusBar
        barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.centerContent}>
          <Text style={styles.headline}>Welcome to NTRL</Text>
          <Text style={styles.subheadline}>News, unaltered and free of spin.</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

/**
 * Gradient colors for light and dark modes.
 * Very subtle shift — barely perceptible for calm aesthetic.
 */
function getGradientColors(colorMode: ColorMode): readonly [string, string] {
  if (colorMode === 'dark') {
    // Subtle darkening toward base
    return ['#1A1816', '#161412'] as const;
  }
  // Subtle warm shift for light mode
  return ['#FAF9F6', '#F5F3EF'] as const;
}

function createStyles(theme: Theme) {
  const { colors, spacing, layout } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
    },

    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
    },

    centerContent: {
      maxWidth: 300,
      alignItems: 'center',
    },

    headline: {
      fontFamily: 'Georgia',
      fontSize: 30,
      fontWeight: '600',
      letterSpacing: -0.3,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },

    subheadline: {
      fontSize: 17,
      fontWeight: '400',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
  });
}
