import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, layout } from '../theme';
import { openExternalUrl } from '../utils/links';
import type { Item } from '../types';

type Props = {
  route: any;
  navigation: any;
};

/**
 * Format date/time for footer display
 */
function formatUpdatedTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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
      <Text style={styles.headerTitle}>Transparency</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

/**
 * Render original text with soft highlights on removed phrases
 */
function HighlightedText({
  text,
  highlights,
}: {
  text: string;
  highlights: string[];
}) {
  if (!text) {
    return null;
  }

  if (!highlights || highlights.length === 0) {
    return <Text style={styles.originalText}>{text}</Text>;
  }

  // Build regex pattern for all highlights (case-insensitive)
  const escapedHighlights = highlights.map((h) =>
    h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp(`(${escapedHighlights.join('|')})`, 'gi');

  // Split text by highlight matches
  const parts = text.split(pattern);

  return (
    <Text style={styles.originalText}>
      {parts.map((part, index) => {
        const isHighlighted = highlights.some(
          (h) => h.toLowerCase() === part.toLowerCase()
        );
        return isHighlighted ? (
          <Text key={index} style={styles.highlightedSpan}>
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        );
      })}
    </Text>
  );
}

/**
 * Source unavailable modal
 */
function SourceUnavailableModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Source unavailable</Text>
          <Text style={styles.modalBody}>
            This link couldn't be opened. You can try again later.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.modalButton,
              pressed && styles.modalButtonPressed,
            ]}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function RedlineScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const item: Item = route.params.item;
  const updatedTime = formatUpdatedTime(item.published_at);

  const [showSourceError, setShowSourceError] = useState(false);

  const hasOriginalText = !!item.original_text;
  const hasRemovedContent =
    item.detail.removed && item.detail.removed.length > 0;

  // Handle external source link with error fallback
  const handleViewSource = async () => {
    const success = await openExternalUrl(item.url, item.source_url);
    if (!success) {
      setShowSourceError(true);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Header onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro copy */}
        <Text style={styles.intro}>
          This view shows the original article text.
          {hasRemovedContent &&
            ' Language removed by the NTRL Filter is highlighted.'}
        </Text>

        {/* Original text with highlights */}
        {hasOriginalText ? (
          <View style={styles.originalSection}>
            <HighlightedText
              text={item.original_text!}
              highlights={item.detail.removed || []}
            />
          </View>
        ) : (
          <View style={styles.unavailableSection}>
            <Text style={styles.unavailableText}>
              Original text unavailable for this article.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.footerLink,
              pressed && styles.footerLinkPressed,
            ]}
            onPress={handleViewSource}
          >
            <Text style={styles.footerLinkText}>
              View original on {item.source}
            </Text>
          </Pressable>

          <Text style={styles.footerMeta}>Updated: {updatedTime}</Text>
        </View>
      </ScrollView>

      {/* Source error modal */}
      <SourceUnavailableModal
        visible={showSourceError}
        onClose={() => setShowSourceError(false)}
      />
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

  // Scroll content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  // Intro
  intro: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.xl,
  },

  // Original text section
  originalSection: {
    marginBottom: spacing.xxl,
  },
  originalText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 26,
    color: colors.textPrimary,
  },
  highlightedSpan: {
    backgroundColor: colors.highlight,
    borderRadius: 2,
  },

  // Unavailable state
  unavailableSection: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Footer
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    alignItems: 'center',
  },
  footerLink: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  footerLinkPressed: {
    opacity: 0.5,
  },
  footerLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  footerMeta: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSubtle,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.screenPadding,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  modalButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalButtonPressed: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
