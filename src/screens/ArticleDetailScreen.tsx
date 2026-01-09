import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, layout } from '../theme';
import type { Item } from '../types';

type Props = {
  route: any;
  navigation: any;
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };
  return date.toLocaleDateString('en-US', options);
}

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
      <Text style={styles.headerBrand}>NTRL</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function HighlightedText({ text, highlights }: { text: string; highlights?: string[] }) {
  if (!highlights || highlights.length === 0) {
    return <Text style={styles.originalText}>{text}</Text>;
  }

  // Simple highlighting: wrap highlighted phrases
  let result = text;
  const parts: { text: string; highlighted: boolean }[] = [];

  // For now, just render the text with inline highlights
  // In production, you'd parse and highlight specific spans
  highlights.forEach((phrase) => {
    const regex = new RegExp(`(${phrase})`, 'gi');
    result = result.replace(regex, '|||$1|||');
  });

  const segments = result.split('|||').filter(Boolean);

  return (
    <Text style={styles.originalText}>
      {segments.map((segment, idx) => {
        const isHighlighted = highlights.some(
          (h) => h.toLowerCase() === segment.toLowerCase()
        );
        return isHighlighted ? (
          <Text key={idx} style={styles.highlightedSpan}>
            {segment}
          </Text>
        ) : (
          <Text key={idx}>{segment}</Text>
        );
      })}
    </Text>
  );
}

export default function ArticleDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const item: Item = route.params.item;
  const timeAgo = formatRelativeTime(item.published_at);
  const fullDate = formatFullDate(item.published_at);

  // Construct body from structured data
  const bodyParagraphs = [
    item.detail.what_happened,
    item.detail.why_it_matters,
    item.detail.known.length > 0
      ? `What is known: ${item.detail.known.join('. ')}.`
      : null,
    item.detail.uncertain.length > 0
      ? `What remains uncertain: ${item.detail.uncertain.join('. ')}.`
      : null,
  ].filter(Boolean);

  const hasRemovedContent = item.detail.removed && item.detail.removed.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Header onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean Article View */}
        <Text style={styles.headline}>{item.headline}</Text>

        <View style={styles.bodySection}>
          {bodyParagraphs.map((para, idx) => (
            <Text key={idx} style={styles.bodyText}>
              {para}
            </Text>
          ))}
        </View>

        <Text style={styles.meta}>
          {item.source} · {timeAgo}
        </Text>

        {/* Disclosure */}
        {hasRemovedContent && (
          <Text style={styles.disclosure}>Manipulative language removed.</Text>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Original Reporting Section (Transparency) */}
        {hasRemovedContent && (
          <View style={styles.transparencySection}>
            <Text style={styles.sectionTitle}>ORIGINAL REPORTING</Text>
            <Text style={styles.transparencyIntro}>
              Highlighted text indicates language that was removed or softened.
            </Text>

            {/* Show original with highlights */}
            <HighlightedText
              text={item.summary}
              highlights={item.detail.removed}
            />

            {/* List what was removed */}
            <View style={styles.removedList}>
              {item.detail.removed?.map((phrase, idx) => (
                <View key={idx} style={styles.removedItem}>
                  <Text style={styles.removedPhrase}>"{phrase}"</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer Links */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.linkButton,
              pressed && styles.linkButtonPressed,
            ]}
            onPress={() => Linking.openURL(item.url)}
          >
            <Text style={styles.linkText}>View original on {item.source}</Text>
          </Pressable>

          <Text style={styles.footerMeta}>
            Updated: {fullDate}
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
  headerBrand: {
    ...typography.brand,
    fontSize: 16,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 32,
  },

  // Scroll content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  // Article content
  headline: {
    ...typography.detailHeadline,
    marginBottom: spacing.xl,
  },
  bodySection: {
    marginBottom: spacing.lg,
  },
  bodyText: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  meta: {
    ...typography.meta,
    marginBottom: spacing.md,
  },
  disclosure: {
    ...typography.disclosure,
    marginBottom: spacing.xl,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xl,
  },

  // Transparency section
  transparencySection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.md,
  },
  transparencyIntro: {
    ...typography.meta,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  originalText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  highlightedSpan: {
    backgroundColor: colors.highlight,
    color: colors.textPrimary,
  },
  removedList: {
    marginTop: spacing.lg,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.dividerSubtle,
  },
  removedItem: {
    marginBottom: spacing.sm,
  },
  removedPhrase: {
    ...typography.meta,
    fontStyle: 'italic',
  },

  // Footer
  footer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  linkButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  linkButtonPressed: {
    opacity: 0.6,
  },
  linkText: {
    ...typography.link,
  },
  footerMeta: {
    ...typography.meta,
    fontSize: 12,
    marginTop: spacing.md,
  },
});
