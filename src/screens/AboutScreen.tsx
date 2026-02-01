import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import type { AboutScreenProps } from '../navigation/types';

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
      <Text style={styles.backArrow}>‹</Text>
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
      <Text style={styles.headerTitle}>About NTRL</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function Section({
  title,
  children,
  styles,
}: {
  title: string;
  children: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

/**
 * Displays static informational content about the NTRL app.
 * - Explains what NTRL does and does not do, what it removes vs. preserves
 * - Describes the content processing pipeline at a high level
 */
export default function AboutScreen({ navigation }: AboutScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          <Text style={styles.introBold}>NTRL removes manipulative language from information.</Text>
          {'\n\n'}
          <Text style={styles.introBold}>Understand what matters without being sold to, provoked, or worked up.</Text>
        </Text>

        <Section title="What this is" styles={styles}>
          <Text style={styles.body}>
            A reading layer that shortens, de-triggers and structures information into neutral
            summaries, while also offering full articles with manipulative language removed. Each
            piece shows what happened, why it matters, what is known, and what remains uncertain —
            and includes a transparency view so you can see what was removed and why.
          </Text>
        </Section>

        <Section title="What this is not" styles={styles}>
          <Text style={styles.body}>
            A truth engine. NTRL removes tone and manipulation, not factual claims. It can still be
            wrong; when information is uncertain, we say so explicitly instead of guessing.
          </Text>
        </Section>

        <Section title="What we remove" styles={styles}>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Clickbait, sensationalism, and urgency inflation</Text>
            <Text style={styles.listItem}>• Emotional triggers and selling language</Text>
            <Text style={styles.listItem}>• Agenda signaling and rhetorical framing</Text>
          </View>
        </Section>

        <Section title="What we preserve" styles={styles}>
          <Text style={styles.body}>
            Facts, quotes, context and nuance. We strip the manipulation, not the information.
          </Text>
        </Section>

        <Section title="How it works" styles={styles}>
          <Text style={styles.body}>
            Sources are ingested, content is extracted, and manipulative language is identified and
            removed. We then generate both neutral summaries and full articles. For every story, you
            can view a redline showing exactly what we removed.
          </Text>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Filtered for clarity. Signal preserved.</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Manifesto')}
          hitSlop={12}
          accessibilityLabel="Read why we built NTRL"
          accessibilityRole="button"
        >
          {({ pressed }) => (
            <Text style={[styles.manifestoLink, pressed && styles.manifestoLinkPressed]}>
              Why NTRL?
            </Text>
          )}
        </Pressable>
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
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 40,
    },

    // Content
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
    },

    intro: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      color: colors.textPrimary,
      marginBottom: spacing.xl,
    },
    introBold: {
      fontWeight: '600',
    },

    // Sections
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      color: colors.textSubtle,
      marginBottom: spacing.md,
    },
    body: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 21,
      color: colors.textSecondary,
    },

    // List
    list: {
      gap: spacing.sm,
    },
    listItem: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 21,
      color: colors.textSecondary,
    },

    // Footer
    footer: {
      marginTop: spacing.lg,
      paddingTop: spacing.xl,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 13,
      fontWeight: '400',
      fontStyle: 'italic',
      color: colors.textMuted,
    },

    // Manifesto link
    manifestoLink: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textMuted,
      textDecorationLine: 'underline',
      textDecorationColor: colors.dividerSubtle,
      marginTop: spacing.xl,
      textAlign: 'center',
    },
    manifestoLinkPressed: {
      opacity: 0.6,
    },
  });
}
