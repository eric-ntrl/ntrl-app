import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, layout } from '../theme';

type Props = {
  navigation: any;
};

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.backButton,
        pressed && styles.backButtonPressed,
      ]}
      hitSlop={12}
    >
      <Text style={styles.backArrow}>‹</Text>
    </Pressable>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} />
      <Text style={styles.headerTitle}>Transparency</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function TransparencyScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Header onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          NTRL removes manipulative language from information so you can understand
          what matters without being sold to, provoked, or worked up for someone
          else's agenda.
        </Text>

        <Section title="What this is">
          <Text style={styles.body}>
            A reading layer that shortens, de-triggers, and structures information
            into neutral summaries. Every article shows what happened, why it matters,
            what is known, and what remains uncertain.
          </Text>
        </Section>

        <Section title="What this is not">
          <Text style={styles.body}>
            A truth engine. NTRL removes tone and manipulation, not factual claims.
            It can be wrong. When information is uncertain, we say so explicitly
            instead of guessing.
          </Text>
        </Section>

        <Section title="What we remove">
          <View style={styles.list}>
            <Text style={styles.listItem}>• Clickbait and sensationalism</Text>
            <Text style={styles.listItem}>• Urgency inflation</Text>
            <Text style={styles.listItem}>• Emotional triggers</Text>
            <Text style={styles.listItem}>• Selling language</Text>
            <Text style={styles.listItem}>• Agenda signaling</Text>
            <Text style={styles.listItem}>• Rhetorical framing</Text>
          </View>
        </Section>

        <Section title="What we preserve">
          <Text style={styles.body}>
            Facts, quotes, context, and nuance. We strip the manipulation,
            not the information.
          </Text>
        </Section>

        <Section title="How it works">
          <Text style={styles.body}>
            Sources are ingested, content is extracted, manipulative language is
            identified and removed, and summaries are generated. You can always
            see what was changed by viewing the original reporting section on any article.
          </Text>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Filtered for clarity. Signal preserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.5,
  },
  backArrow: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.textPrimary,
    marginTop: -2,
  },
  headerTitle: {
    ...typography.brand,
    fontSize: 16,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 32,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },

  intro: {
    ...typography.body,
    fontSize: 17,
    lineHeight: 26,
    marginBottom: spacing.xxl,
  },

  // Sections
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // List
  list: {
    marginTop: spacing.xs,
  },
  listItem: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  // Footer
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    alignItems: 'center',
  },
  footerText: {
    ...typography.disclosure,
  },
});
