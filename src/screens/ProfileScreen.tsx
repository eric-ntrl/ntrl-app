import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import type { Theme, TextSizePreference, ColorModePreference } from '../theme/types';
import { getPreferences, updatePreferences } from '../storage/storageService';
import type { ProfileScreenProps } from '../navigation/types';

// Topic options matching API feed categories
const TOPICS = [
  { key: 'world', label: 'World' },
  { key: 'us', label: 'U.S.' },
  { key: 'local', label: 'Local' },
  { key: 'business', label: 'Business' },
  { key: 'technology', label: 'Technology' },
  { key: 'science', label: 'Science' },
  { key: 'health', label: 'Health' },
  { key: 'environment', label: 'Environment' },
  { key: 'sports', label: 'Sports' },
  { key: 'culture', label: 'Culture' },
];

// Text size options
const TEXT_SIZE_OPTIONS: { key: TextSizePreference; label: string }[] = [
  { key: 'small', label: 'Small' },
  { key: 'medium', label: 'Medium' },
  { key: 'large', label: 'Large' },
];

// Color mode options
const COLOR_MODE_OPTIONS: { key: ColorModePreference; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'System' },
];

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
      <View style={styles.headerCenter}>
        <Text style={styles.headerBrand}>NTRL</Text>
      </View>
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

function NavigationRow({
  icon,
  label,
  onPress,
  styles,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.navRow, pressed && styles.navRowPressed]}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={styles.navIcon}>{icon}</Text>
      <Text style={styles.navLabel}>{label}</Text>
      <Text style={styles.navChevron}>›</Text>
    </Pressable>
  );
}

function TopicChip({
  label,
  selected,
  onToggle,
  styles,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
      onPress={onToggle}
      accessibilityLabel={`${label} topic ${selected ? 'selected' : 'not selected'}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function TextSizeOption({
  label,
  selected,
  onSelect,
  styles,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.textSizeOption,
        selected && styles.textSizeOptionSelected,
        pressed && styles.textSizeOptionPressed,
      ]}
      onPress={onSelect}
      accessibilityLabel={`${label} text size ${selected ? 'selected' : ''}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <Text style={[styles.textSizeLabel, selected && styles.textSizeLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function ColorModeOption({
  label,
  selected,
  onSelect,
  styles,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.textSizeOption,
        selected && styles.textSizeOptionSelected,
        pressed && styles.textSizeOptionPressed,
      ]}
      onPress={onSelect}
      accessibilityLabel={`${label} appearance ${selected ? 'selected' : ''}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <Text style={[styles.textSizeLabel, selected && styles.textSizeLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Displays user settings and preferences for the NTRL app.
 * - Allows toggling feed topic categories, text size, and light/dark appearance
 * - Provides navigation to Saved Articles, Reading History, and About
 * - Persists preferences to SecureStore; changes take effect on next feed load
 */
export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, textSize, setTextSize, colorMode, colorModePreference, setColorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Load preferences when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      async function loadPrefs() {
        const prefs = await getPreferences();
        setSelectedTopics(prefs.topics);
      }
      loadPrefs();
    }, [])
  );

  const handleTopicToggle = async (topicKey: string) => {
    let newTopics: string[];
    if (selectedTopics.includes(topicKey)) {
      newTopics = selectedTopics.filter((t) => t !== topicKey);
    } else {
      newTopics = [...selectedTopics, topicKey];
    }
    setSelectedTopics(newTopics);
    await updatePreferences({ topics: newTopics });
  };

  const handleTextSizeChange = async (size: TextSizePreference) => {
    await setTextSize(size);
  };

  const handleColorModeChange = async (mode: ColorModePreference) => {
    await setColorMode(mode);
  };

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message:
          'Check out NTRL - news without the manipulation. It removes clickbait, urgency, and emotional triggers so you can understand what actually matters.',
      });
    } catch (error) {
      // User cancelled or share failed - no action needed
    }
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
        {/* Account Section */}
        <SectionHeader title="Account" styles={styles} />
        <View style={styles.card}>
          <Text style={styles.cardText}>Sign in to sync your preferences across devices</Text>
          <Pressable
            style={({ pressed }) => [styles.signInButton, pressed && styles.signInButtonPressed]}
            accessibilityLabel="Sign in"
            accessibilityRole="button"
          >
            <Text style={styles.signInButtonText}>Coming soon</Text>
          </Pressable>
        </View>

        {/* Your Content Section */}
        <SectionHeader title="Your Content" styles={styles} />
        <View style={styles.navCard}>
          <NavigationRow
            icon="★"
            label="Saved Articles"
            onPress={() => navigation.navigate('SavedArticles')}
            styles={styles}
          />
          <View style={styles.navDivider} />
          <NavigationRow
            icon="◷"
            label="Reading History"
            onPress={() => navigation.navigate('History')}
            styles={styles}
          />
        </View>

        {/* Reading Section - Text Size */}
        <SectionHeader title="Reading" styles={styles} />
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Text Size</Text>
          <View style={styles.textSizeContainer}>
            {TEXT_SIZE_OPTIONS.map((option) => (
              <TextSizeOption
                key={option.key}
                label={option.label}
                selected={textSize === option.key}
                onSelect={() => handleTextSizeChange(option.key)}
                styles={styles}
              />
            ))}
          </View>
          <Text style={styles.cardHint}>Adjusts text in articles and headlines</Text>
        </View>

        {/* Appearance Section - Color Mode */}
        <SectionHeader title="Appearance" styles={styles} />
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Mode</Text>
          <View style={styles.textSizeContainer}>
            {COLOR_MODE_OPTIONS.map((option) => (
              <ColorModeOption
                key={option.key}
                label={option.label}
                selected={colorModePreference === option.key}
                onSelect={() => handleColorModeChange(option.key)}
                styles={styles}
              />
            ))}
          </View>
          <Text style={styles.cardHint}>System follows your device settings</Text>
        </View>

        {/* Preferences Section */}
        <SectionHeader title="Preferences" styles={styles} />
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Topics</Text>
          <View style={styles.chipContainer}>
            {TOPICS.map((topic) => (
              <TopicChip
                key={topic.key}
                label={topic.label}
                selected={selectedTopics.includes(topic.key)}
                onToggle={() => handleTopicToggle(topic.key)}
                styles={styles}
              />
            ))}
          </View>
          <Text style={styles.cardHint}>Select topics to customize your feed</Text>
        </View>

        {/* Share NTRL Section */}
        <SectionHeader title="Share NTRL" styles={styles} />
        <View style={styles.navCard}>
          <NavigationRow
            icon="↗"
            label="Invite friends to NTRL"
            onPress={handleInviteFriends}
            styles={styles}
          />
        </View>

        {/* About Link */}
        <Pressable
          style={({ pressed }) => [styles.aboutLink, pressed && styles.aboutLinkPressed]}
          onPress={() => navigation.navigate('About')}
          accessibilityLabel="About NTRL"
          accessibilityRole="link"
        >
          <Text style={styles.aboutLinkText}>About NTRL</Text>
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
    headerCenter: {
      alignItems: 'center',
    },
    headerBrand: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
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
    cardText: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    cardLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
      marginBottom: spacing.md,
    },
    cardHint: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textSubtle,
      marginTop: spacing.md,
      fontStyle: 'italic',
    },

    // Sign In Button
    signInButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.divider,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    signInButtonPressed: {
      opacity: 0.6,
    },
    signInButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
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
      paddingVertical: spacing.lg,
      paddingHorizontal: layout.cardPadding,
    },
    navRowPressed: {
      backgroundColor: colors.dividerSubtle,
    },
    navIcon: {
      fontSize: 18,
      color: colors.textMuted,
      width: 28,
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
    navDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
      marginLeft: layout.cardPadding + 28,
    },

    // Topic Chips
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.background,
    },
    chipSelected: {
      borderColor: colors.accent,
      backgroundColor: 'rgba(122, 139, 153, 0.1)',
    },
    chipPressed: {
      opacity: 0.6,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textMuted,
    },
    chipTextSelected: {
      color: colors.textPrimary,
      fontWeight: '500',
    },

    // Text Size Options
    textSizeContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    textSizeOption: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    textSizeOptionSelected: {
      borderColor: colors.accentSecondary,
      backgroundColor: colors.accentSecondarySubtle,
    },
    textSizeOptionPressed: {
      opacity: 0.6,
    },
    textSizeLabel: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textMuted,
    },
    textSizeLabelSelected: {
      color: colors.textPrimary,
      fontWeight: '500',
    },

    // About Link
    aboutLink: {
      marginTop: spacing.xxl,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    aboutLinkPressed: {
      opacity: 0.5,
    },
    aboutLinkText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
    },
  });
}
