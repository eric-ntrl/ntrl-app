import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

interface WhatNtrlIsScreenProps {
  onComplete: () => void;
}

const MANIFESTO_COPY = `You know the feeling.
The tightness after a headline.
The scroll that won't stop.

The news doesn't start this way.
It becomes this way—
compressed, sharpened, pushed toward reaction,
toward a click, toward an agenda.

News was meant to inform you.
Now it's optimized to inflame you.

Every trigger.
Every surge of dread.
That isn't the story.
It's the business model.

ntrl removes what was added.

Same facts.
Same events.

No hype.
No manufactured urgency.
No agenda.

No emotional toll just to stay informed.

ntrl.news
The news, unaltered.`;

/**
 * First-run onboarding screen displaying NTRL's manifesto.
 * Shown only once on first app launch, before user enters the main app.
 */
export default function WhatNtrlIsScreen({ onComplete }: WhatNtrlIsScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.manifesto}>{MANIFESTO_COPY}</Text>
        </ScrollView>

        <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <Pressable
            onPress={onComplete}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            accessibilityLabel="Begin using NTRL"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Begin</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing, layout } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      flex: 1,
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxxl,
    },

    manifesto: {
      fontFamily: 'Georgia',
      fontSize: 17,
      lineHeight: 28,
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },

    buttonContainer: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.lg,
      backgroundColor: colors.background,
    },

    button: {
      backgroundColor: colors.textPrimary,
      paddingVertical: spacing.lg,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },

    buttonPressed: {
      opacity: 0.8,
    },

    buttonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
  });
}
