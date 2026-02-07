import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import type { Theme, TextSizePreference, ColorModePreference, ColorMode } from '../theme/types';
import { lightTap } from '../utils/haptics';
import TextSizePreview from '../components/TextSizePreview';
import ThemePreviewCard from '../components/ThemePreviewCard';
import type { SettingsScreenProps } from '../navigation/types';

// Text size options (now 4)
const TEXT_SIZE_OPTIONS: TextSizePreference[] = ['small', 'medium', 'large', 'extraLarge'];

// Color mode options (now includes sepia, excludes system for visual simplicity)
const COLOR_MODE_OPTIONS: ColorMode[] = ['light', 'dark', 'sepia'];

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
      <Text style={styles.headerTitle}>Settings</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function SectionHeader({
  title,
  styles,
}: {
  title: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
    </View>
  );
}

/**
 * SettingsScreen — app configuration accessed via gear icon in Profile.
 * Contains: Reading (text size), Appearance (theme), Account.
 */
export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, textSize, setTextSize, colorMode, colorModePreference, setColorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleTextSizeChange = async (size: TextSizePreference) => {
    lightTap();
    await setTextSize(size);
  };

  const handleColorModeChange = async (mode: ColorModePreference) => {
    lightTap();
    await setColorMode(mode);
  };

  const handleSignIn = () => {
    Alert.alert('Coming Soon', 'Account sign-in and sync coming soon.');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://ntrl.news/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://ntrl.news/terms');
  };

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
        {/* Reading (Text Size) */}
        <SectionHeader title="Reading" styles={styles} />
        <View style={styles.card}>
          <View style={styles.textSizeContainer}>
            {TEXT_SIZE_OPTIONS.map((size) => (
              <TextSizePreview
                key={size}
                size={size}
                selected={textSize === size}
                onSelect={() => handleTextSizeChange(size)}
              />
            ))}
          </View>
          <Text style={styles.previewText}>This is how article text will appear.</Text>
          <Text style={styles.cardHint}>Adjust font size throughout the app</Text>
        </View>

        {/* Appearance */}
        <SectionHeader title="Appearance" styles={styles} />
        <View style={styles.card}>
          <View style={styles.themeContainer}>
            {COLOR_MODE_OPTIONS.map((mode) => (
              <ThemePreviewCard
                key={mode}
                mode={mode}
                selected={colorMode === mode}
                onSelect={() => handleColorModeChange(mode)}
              />
            ))}
          </View>
          {colorMode === 'sepia' && (
            <Text style={styles.sepiaHint}>Sepia is designed for low-light reading</Text>
          )}
        </View>

        {/* Account & Sync */}
        <SectionHeader title="Account & Sync" styles={styles} />
        <View style={styles.navCard}>
          <Pressable
            style={({ pressed }) => [styles.navRow, pressed && styles.navRowPressed]}
            onPress={handleSignIn}
            accessibilityLabel="Sign in to sync"
            accessibilityRole="button"
          >
            <Text style={styles.navLabel}>Sign in to sync</Text>
            <Text style={styles.navChevron}>›</Text>
          </Pressable>
        </View>
        <Text style={styles.syncHint}>
          Sync your saved articles and preferences across devices.
        </Text>

        {/* Legal Links */}
        <View style={styles.legalSection}>
          <Pressable
            style={({ pressed }) => [styles.legalLink, pressed && styles.legalLinkPressed]}
            onPress={handlePrivacyPolicy}
            accessibilityLabel="Privacy Policy"
            accessibilityRole="link"
          >
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.legalDivider}>·</Text>
          <Pressable
            style={({ pressed }) => [styles.legalLink, pressed && styles.legalLinkPressed]}
            onPress={handleTermsOfService}
            accessibilityLabel="Terms of Service"
            accessibilityRole="link"
          >
            <Text style={styles.legalLinkText}>Terms of Service</Text>
          </Pressable>
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
      paddingBottom: spacing.xxxl,
    },

    // Section Header
    sectionHeader: {
      marginTop: spacing.xl,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      color: colors.textSubtle,
    },

    // Card
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: layout.cardPadding,
    },
    cardHint: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textSubtle,
      marginTop: spacing.md,
      fontStyle: 'italic',
    },

    // Text Size Preview
    textSizeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    previewText: {
      fontSize: 15,
      fontWeight: '400',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.lg,
      fontFamily: 'Georgia',
    },

    // Theme Preview
    themeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    sepiaHint: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textSubtle,
      textAlign: 'center',
      marginTop: spacing.md,
      fontStyle: 'italic',
    },

    // Navigation Card
    navCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.lg,
      paddingHorizontal: layout.cardPadding,
    },
    navRowPressed: {
      backgroundColor: colors.dividerSubtle,
    },
    navLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: '400',
      color: colors.textPrimary,
    },
    navChevron: {
      fontSize: 20,
      fontWeight: '300',
      color: colors.textMuted,
    },

    // Sync hint
    syncHint: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textSubtle,
      marginTop: spacing.sm,
      marginHorizontal: spacing.sm,
    },

    // Legal Links
    legalSection: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.xxl,
      paddingVertical: spacing.lg,
    },
    legalLink: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    legalLinkPressed: {
      opacity: 0.5,
    },
    legalLinkText: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
    },
    legalDivider: {
      fontSize: 13,
      color: colors.textSubtle,
    },
  });
}
