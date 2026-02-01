import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import type { ManifestoScreenProps } from '../navigation/types';

function BackButton({
  onPress,
  styles,
}: {
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
      hitSlop={12}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Text style={styles.backArrow}>{'\u2039'}</Text>
    </Pressable>
  );
}

function Header({
  onBack,
  styles,
}: {
  onBack: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} styles={styles} />
      <View style={styles.headerSpacer} />
      <View style={styles.headerSpacer} />
    </View>
  );
}

/**
 * Manifesto screen - poetic explanation of why NTRL exists.
 * Accessible from About NTRL (profile flow).
 */
export default function ManifestoScreen({ navigation }: ManifestoScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Header onBack={() => navigation.goBack()} styles={styles} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.text}>
          You know the feeling — the tightness after a headline, the scroll that won't stop.
        </Text>

        <Text style={styles.text}>
          The news doesn't start this way; it becomes this way — compressed, sharpened, pushed toward reaction, toward a click, toward an agenda.
        </Text>

        <Text style={styles.text}>
          News was supposed to inform you. Now it's optimized to inflame you.
        </Text>

        <Text style={styles.text}>
          Every trigger, every surge of dread — that's not the story; that's the business model.
        </Text>

        <Text style={styles.textHighlight}>
          NTRL removes what was added: same facts, same events.
        </Text>

        <Text style={styles.text}>
          No hype. No manufactured urgency. No agenda. No emotional toll just to stay informed.
        </Text>

        <View style={styles.tagline}>
          <Text style={styles.taglineText}>ntrl.news — The news, unaltered.</Text>
        </View>
      </ScrollView>
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

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonPressed: {
      opacity: 0.5,
    },
    backArrow: {
      fontSize: 32,
      fontWeight: '300',
      color: colors.textPrimary,
      marginTop: -4,
    },
    headerSpacer: {
      width: 40,
    },

    // Content
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.xl,
      maxWidth: 360,
      alignSelf: 'center',
    },

    text: {
      fontFamily: 'Georgia',
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },

    textHighlight: {
      fontFamily: 'Georgia',
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },

    tagline: {
      marginTop: spacing.md,
      paddingTop: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },

    taglineText: {
      fontFamily: 'Georgia',
      fontSize: 14,
      fontStyle: 'italic',
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
}
