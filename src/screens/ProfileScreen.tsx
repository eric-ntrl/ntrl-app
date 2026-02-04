import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Share } from 'react-native';

function SettingsIcon({ color }: { color: string }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}>
      <View style={{ width: 14, height: 1.5, backgroundColor: color, borderRadius: 0.75 }} />
      <View style={{ width: 14, height: 1.5, backgroundColor: color, borderRadius: 0.75, marginTop: 4 }} />
      <View style={{ width: 14, height: 1.5, backgroundColor: color, borderRadius: 0.75, marginTop: 4 }} />
    </View>
  );
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { getPreferences, updatePreferences, getWeeklyReadingStats, type WeeklyReadingStats } from '../storage/storageService';
import { lightTap } from '../utils/haptics';
import type { ProfileScreenProps } from '../navigation/types';
// import { getUserStatsOverview, type StatsOverview } from '../services/statsService';
// import { MyStatsCard } from '../components/stats';
import ReadingInsightsCard from '../components/stats/ReadingInsightsCard';
import Slider from '../components/Slider';

// Topic options matching API feed categories (renamed to Sections)
const SECTIONS = [
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

function Header({
  onSettings,
  styles,
  colors,
}: {
  onSettings: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: Theme['colors'];
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft} />
      <View style={styles.headerCenter}>
        <Text style={styles.headerBrand}>Profile</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.headerIcon, pressed && styles.headerIconPressed]}
        onPress={onSettings}
        hitSlop={8}
        accessibilityLabel="Settings"
        accessibilityRole="button"
      >
        <SettingsIcon color={colors.textMuted} />
      </Pressable>
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

function SectionChip({
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
      accessibilityLabel={`${label} section ${selected ? 'selected' : 'not selected'}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

/**
 * ProfileScreen — user-facing content and preferences.
 * Config (text size, appearance, account) moved to SettingsScreen.
 * Gear icon in header navigates to Settings.
 *
 * Section order:
 * 1. How NTRL Works
 * 2. Reading Insights
 * 3. Your Content
 * 4. Your Sections
 * 5. Today Feed
 * 6. Sections Feed
 * 7. Invite Friends
 * 8. About NTRL
 * (My Stats — removed)
 */
export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [articleCap, setArticleCap] = useState(7);
  const [sectionsArticleCap, setSectionsArticleCap] = useState(7);
  // const [stats, setStats] = useState<StatsOverview>({
  //   ntrlDays: 0,
  //   totalSessions: 0,
  //   ntrlMinutes: 0,
  //   phrasesAvoided: 0,
  // });
  const [weeklyStats, setWeeklyStats] = useState<WeeklyReadingStats>({
    weeklyMinutes: 0,
    articlesCompleted: 0,
    termsNeutralized: 0,
    savedThisWeek: 0,
    readThisWeek: 0,
  });

  // Load preferences and stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      async function loadData() {
        const [prefs, weeklyData] = await Promise.all([
          getPreferences(),
          // getUserStatsOverview(),
          getWeeklyReadingStats(),
        ]);
        setSelectedSections(prefs.topics);
        setArticleCap(prefs.todayArticleCap ?? 7);
        setSectionsArticleCap(prefs.sectionsArticleCap ?? 7);
        // setStats(statsData);
        setWeeklyStats(weeklyData);
      }
      loadData();
    }, [])
  );

  const handleSectionToggle = async (sectionKey: string) => {
    lightTap();
    let newSections: string[];
    if (selectedSections.includes(sectionKey)) {
      newSections = selectedSections.filter((s) => s !== sectionKey);
    } else {
      newSections = [...selectedSections, sectionKey];
    }
    setSelectedSections(newSections);
    await updatePreferences({ topics: newSections });
  };

  const handleArticleCapChange = async (value: number) => {
    setArticleCap(value);
    await updatePreferences({ todayArticleCap: value });
  };

  const handleSectionsArticleCapChange = async (value: number) => {
    setSectionsArticleCap(value);
    await updatePreferences({ sectionsArticleCap: value });
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

  // const handleShareStats = async () => {
  //   try {
  //     const message = `My NTRL Stats\n\n${stats.ntrlDays} NTRL Days\n${stats.totalSessions} Reading Sessions\n${stats.ntrlMinutes} NTRL Minutes\n${stats.phrasesAvoided} Phrases Avoided\n\nNTRL removes manipulative language from news so you can read what actually happened.`;
  //     await Share.share({ message });
  //   } catch (error) {
  //     // User cancelled or share failed - no action needed
  //   }
  // };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Header
        onSettings={() => navigation.navigate('Settings')}
        styles={styles}
        colors={colors}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. How NTRL Works */}
        <SectionHeader title="How NTRL Works" styles={styles} />
        <View style={styles.card}>
          <Text style={styles.cardText}>
            NTRL strips manipulative language from news — clickbait, urgency cues, and emotional
            triggers — so you can read what actually happened without being sold to or worked up.
            Every article shows what was changed.
          </Text>
        </View>

        {/* My Stats — commented out
        <SectionHeader title="My Stats" styles={styles} />
        <MyStatsCard
          ntrlDays={stats.ntrlDays}
          totalSessions={stats.totalSessions}
          ntrlMinutes={stats.ntrlMinutes}
          phrasesAvoided={stats.phrasesAvoided}
          onPhrasesPress={() => navigation.navigate('ManipulationAvoided')}
          onSharePress={handleShareStats}
        />
        */}

        {/* 2. Reading Insights */}
        <SectionHeader title="Reading Insights" styles={styles} />
        <ReadingInsightsCard
          weeklyMinutes={weeklyStats.weeklyMinutes}
          articlesCompleted={weeklyStats.articlesCompleted}
          termsNeutralized={weeklyStats.termsNeutralized}
        />

        {/* 3. Your Content */}
        <SectionHeader title="Your Content" styles={styles} />
        <View style={styles.navCard}>
          <NavigationRow
            icon="◷"
            label="Reading History"
            onPress={() => navigation.navigate('History')}
            styles={styles}
          />
          <View style={styles.navDivider} />
          <NavigationRow
            icon="★"
            label="Saved Articles"
            onPress={() => navigation.navigate('SavedArticles')}
            styles={styles}
          />
        </View>

        {/* 4. Your Sections (formerly Topics) */}
        <SectionHeader title="Your Sections" styles={styles} />
        <View style={styles.card}>
          <View style={styles.chipContainer}>
            {SECTIONS.map((section) => (
              <SectionChip
                key={section.key}
                label={section.label}
                selected={selectedSections.includes(section.key)}
                onToggle={() => handleSectionToggle(section.key)}
                styles={styles}
              />
            ))}
          </View>
          <Text style={styles.cardHint}>Choose sections to personalize your feed</Text>
        </View>

        {/* 5. Today Feed */}
        <SectionHeader title="Today Feed" styles={styles} />
        <View style={styles.card}>
          <Slider
            value={articleCap}
            min={3}
            max={15}
            onChange={handleArticleCapChange}
            label="Stories shown"
            description="Select how many stories appear in your Today feed"
          />
        </View>

        {/* 6. Sections Feed */}
        <SectionHeader title="Sections Feed" styles={styles} />
        <View style={styles.card}>
          <Slider
            value={sectionsArticleCap}
            min={3}
            max={15}
            onChange={handleSectionsArticleCapChange}
            label="Stories per section"
            description="Select how many stories appear per section"
          />
        </View>

        {/* 7. Invite Friends */}
        <SectionHeader title="Share" styles={styles} />
        <View style={styles.navCard}>
          <NavigationRow
            icon="↗"
            label="Invite friends"
            onPress={handleInviteFriends}
            styles={styles}
          />
        </View>

        {/* 8. About NTRL */}
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
    headerLeft: {
      width: 40,
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
    headerIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerIconPressed: {
      opacity: 0.5,
    },
    headerIconText: {
      fontSize: 22,
      color: colors.textMuted,
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
    },
    cardHint: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textSubtle,
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

    // Section Chips
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
      backgroundColor: colors.accentSecondarySubtle,
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
}
