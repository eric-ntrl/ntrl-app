import React, { useState, useMemo } from 'react';
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
import { findRedlines, type RedlineSpan } from '../services/redline';
import type { Item } from '../types';

type Props = {
  route: {
    params: {
      item: Item;
      extractedText?: string | null;
      // Note: redlines are now computed locally on display text for perfect alignment
    };
  };
  navigation: any;
};

/**
 * Normalize text for consistent display and redline detection
 * Ensures spans computed on this text match exactly what's rendered
 */
function normalizeDisplayText(text: string): string {
  return text
    // Normalize whitespace (collapse multiple spaces/newlines)
    .replace(/\s+/g, ' ')
    // Trim
    .trim();
}

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
 * Render original text with soft highlights on redlined spans
 * Uses position-based highlighting for accuracy
 */
function HighlightedText({
  text,
  redlines,
}: {
  text: string;
  redlines: RedlineSpan[];
}) {
  if (!text) {
    return null;
  }

  if (!redlines || redlines.length === 0) {
    return <Text style={styles.originalText}>{text}</Text>;
  }

  // Sort redlines by start position
  const sortedRedlines = [...redlines].sort((a, b) => a.start - b.start);

  // Build segments
  const segments: Array<{ text: string; highlighted: boolean }> = [];
  let currentPos = 0;

  for (const redline of sortedRedlines) {
    // Add non-highlighted segment before this redline
    if (redline.start > currentPos) {
      segments.push({
        text: text.substring(currentPos, redline.start),
        highlighted: false,
      });
    }

    // Add highlighted segment
    if (redline.start < text.length) {
      segments.push({
        text: text.substring(redline.start, Math.min(redline.end, text.length)),
        highlighted: true,
      });
      currentPos = redline.end;
    }
  }

  // Add remaining non-highlighted text
  if (currentPos < text.length) {
    segments.push({
      text: text.substring(currentPos),
      highlighted: false,
    });
  }

  return (
    <Text style={styles.originalText}>
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <Text key={index} style={styles.highlightedSpan}>
            {segment.text}
          </Text>
        ) : (
          <Text key={index}>{segment.text}</Text>
        )
      )}
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
  const { item, extractedText } = route.params;
  const updatedTime = formatUpdatedTime(item.published_at);

  const [showSourceError, setShowSourceError] = useState(false);

  // Normalize display text ONCE, then compute redlines on that exact text
  // This guarantees span positions align perfectly with rendered content
  const displayText = useMemo(() => {
    const rawText = extractedText || item.original_text || null;
    return rawText ? normalizeDisplayText(rawText) : null;
  }, [extractedText, item.original_text]);

  // Compute redlines on the exact normalized display text
  const redlines = useMemo(() => {
    return displayText ? findRedlines(displayText) : [];
  }, [displayText]);

  const hasOriginalText = !!displayText;
  const hasRedlines = redlines.length > 0;

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
          This view shows the original article text with language NTRL would remove.
        </Text>

        {/* No redlines notice - prominent position */}
        {hasOriginalText && !hasRedlines && (
          <View style={styles.noRedlinesNotice}>
            <Text style={styles.noRedlinesText}>
              No manipulative language flagged in this article.
            </Text>
          </View>
        )}

        {/* Original text with highlights */}
        {hasOriginalText ? (
          <View style={styles.originalSection}>
            <HighlightedText
              text={displayText!}
              redlines={redlines}
            />
          </View>
        ) : (
          <View style={styles.unavailableSection}>
            <Text style={styles.unavailableText}>
              Original article text could not be extracted for this item.
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
  // No redlines notice - prominent position near top
  noRedlinesNotice: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  noRedlinesText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
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
