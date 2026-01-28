import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import type { Theme, TextSizePreference, ColorModePreference } from '../theme/types';
import { lightTap } from '../utils/haptics';
import type { SettingsScreenProps } from '../navigation/types';

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

function OptionButton({
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
        styles.optionButton,
        selected && styles.optionButtonSelected,
        pressed && styles.optionButtonPressed,
      ]}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

/**
 * SettingsScreen — app configuration accessed via gear icon in Profile.
 * Contains: Text Size, Appearance, Account stub.
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
    Alert.alert('Coming Soon', 'Account sign-in coming soon.');
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
        {/* Text Size */}
        <SectionHeader title="Text Size" styles={styles} />
        <View style={styles.card}>
          <View style={styles.optionContainer}>
            {TEXT_SIZE_OPTIONS.map((option) => (
              <OptionButton
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

        {/* Appearance */}
        <SectionHeader title="Appearance" styles={styles} />
        <View style={styles.card}>
          <View style={styles.optionContainer}>
            {COLOR_MODE_OPTIONS.map((option) => (
              <OptionButton
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

        {/* Account */}
        <SectionHeader title="Account" styles={styles} />
        <View style={styles.navCard}>
          <Pressable
            style={({ pressed }) => [styles.navRow, pressed && styles.navRowPressed]}
            onPress={handleSignIn}
            accessibilityLabel="Sign in"
            accessibilityRole="button"
          >
            <Text style={styles.navLabel}>Sign In</Text>
            <Text style={styles.navChevron}>›</Text>
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

    // Option buttons (text size, appearance)
    optionContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    optionButton: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    optionButtonSelected: {
      borderColor: colors.accentSecondary,
      backgroundColor: colors.accentSecondarySubtle,
    },
    optionButtonPressed: {
      opacity: 0.6,
    },
    optionLabel: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textMuted,
    },
    optionLabelSelected: {
      color: colors.textPrimary,
      fontWeight: '500',
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
  });
}
