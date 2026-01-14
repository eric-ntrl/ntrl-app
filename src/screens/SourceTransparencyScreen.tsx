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
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { openExternalUrl } from '../utils/links';

type Props = {
  route: {
    params: {
      sourceName: string;
      sourceUrl?: string | null;
    };
  };
  navigation: any;
};

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
      style={({ pressed }) => [
        styles.backButton,
        pressed && styles.backButtonPressed,
      ]}
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
      <Text style={styles.headerTitle}>Source Info</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function SourceUnavailableModal({
  visible,
  onClose,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  styles: ReturnType<typeof createStyles>;
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

export default function SourceTransparencyScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { sourceName, sourceUrl } = route.params;

  const [showSourceError, setShowSourceError] = useState(false);

  const handleOpenSource = async () => {
    if (!sourceUrl) return;
    const success = await openExternalUrl(sourceUrl);
    if (!success) {
      setShowSourceError(true);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <Header onBack={() => navigation.goBack()} styles={styles} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Source name */}
        <Text style={styles.sourceName}>{sourceName}</Text>

        {/* What NTRL does section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What NTRL does</Text>
          <Text style={styles.sectionBody}>
            NTRL extracts the factual content from this source's articles and
            presents it in a straightforward format. We remove language designed
            to trigger emotional reactions, create urgency, or sensationalize
            the story.
          </Text>
        </View>

        {/* What NTRL doesn't do section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What NTRL doesn't do</Text>
          <Text style={styles.sectionBody}>
            NTRL does not fact-check claims, verify accuracy, or determine
            whether information is true or false. We don't rate sources or
            assign bias scores. The original reporting comes from the source
            — we simply adjust how it's presented.
          </Text>
        </View>

        {/* How NTRL processes this source */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How NTRL processes this source</Text>
          <Text style={styles.sectionBody}>
            Articles from {sourceName} go through the same processing as all
            sources in NTRL. We identify and adjust urgency cues, emotional
            triggers, and sensational phrasing while preserving the factual
            content of the story.
          </Text>
        </View>

        {/* Original source link */}
        {sourceUrl && (
          <View style={styles.linkSection}>
            <Pressable
              onPress={handleOpenSource}
              style={({ pressed }) => [
                styles.sourceLink,
                pressed && styles.sourceLinkPressed,
              ]}
              accessibilityRole="link"
              accessibilityLabel={`Open ${sourceName} website`}
            >
              <Text style={styles.sourceLinkText}>
                Visit {sourceName} →
              </Text>
            </Pressable>
            <Text style={styles.linkHint}>
              Opens in your browser
            </Text>
          </View>
        )}
      </ScrollView>

      <SourceUnavailableModal
        visible={showSourceError}
        onClose={() => setShowSourceError(false)}
        styles={styles}
      />
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

    // Scroll content
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxxl,
    },

    // Source name
    sourceName: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xxl,
    },

    // Sections
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    sectionBody: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 24,
      color: colors.textSecondary,
    },

    // Link section
    linkSection: {
      marginTop: spacing.lg,
      paddingTop: spacing.xl,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      alignItems: 'center',
    },
    sourceLink: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      backgroundColor: colors.textPrimary,
      borderRadius: 8,
      marginBottom: spacing.sm,
    },
    sourceLinkPressed: {
      opacity: 0.8,
    },
    sourceLinkText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.background,
    },
    linkHint: {
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
}
