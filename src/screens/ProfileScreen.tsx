import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, layout } from '../theme';
import { getPreferences, updatePreferences } from '../storage/storageService';

type Props = {
  navigation: any;
};

// Topic options matching API sections
const TOPICS = [
  { key: 'world', label: 'World' },
  { key: 'us', label: 'US' },
  { key: 'local', label: 'Local' },
  { key: 'business', label: 'Business' },
  { key: 'tech', label: 'Tech' },
];

function BackButton({ onPress }: { onPress: () => void }) {
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

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} />
      <View style={styles.headerCenter}>
        <Text style={styles.headerBrand}>NTRL</Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
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
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.navRow,
        pressed && styles.navRowPressed,
      ]}
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
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
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
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Header onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <SectionHeader title="Account" />
        <View style={styles.card}>
          <Text style={styles.cardText}>
            Sign in to sync your preferences across devices
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.signInButton,
              pressed && styles.signInButtonPressed,
            ]}
            accessibilityLabel="Sign in"
            accessibilityRole="button"
          >
            <Text style={styles.signInButtonText}>Coming soon</Text>
          </Pressable>
        </View>

        {/* Your Content Section */}
        <SectionHeader title="Your Content" />
        <View style={styles.navCard}>
          <NavigationRow
            icon="★"
            label="Saved Articles"
            onPress={() => navigation.navigate('SavedArticles')}
          />
          <View style={styles.navDivider} />
          <NavigationRow
            icon="◷"
            label="Reading History"
            onPress={() => navigation.navigate('History')}
          />
        </View>

        {/* Preferences Section */}
        <SectionHeader title="Preferences" />
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Topics</Text>
          <View style={styles.chipContainer}>
            {TOPICS.map((topic) => (
              <TopicChip
                key={topic.key}
                label={topic.label}
                selected={selectedTopics.includes(topic.key)}
                onToggle={() => handleTopicToggle(topic.key)}
              />
            ))}
          </View>
          <Text style={styles.cardHint}>
            Topic filtering coming in a future update
          </Text>
        </View>

        {/* Share NTRL Section */}
        <SectionHeader title="Share NTRL" />
        <View style={styles.navCard}>
          <NavigationRow
            icon="↗"
            label="Invite friends to NTRL"
            onPress={handleInviteFriends}
          />
        </View>

        {/* About Link */}
        <Pressable
          style={({ pressed }) => [
            styles.aboutLink,
            pressed && styles.aboutLinkPressed,
          ]}
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
