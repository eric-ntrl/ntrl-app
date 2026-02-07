import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

type ActionBarProps = {
  /** Whether the article is currently saved */
  isSaved: boolean;
  /** Callback when Save is pressed */
  onSave: () => void;
  /** Callback when Share is pressed */
  onShare: () => void;
  /** Callback when "Original article" is pressed */
  onViewOriginal: () => void;
};

/**
 * Horizontal action bar with Save | Share | Original article.
 * Uses thin-stroke text styling for a calm, understated appearance.
 */
export default function ActionBar({ isSaved, onSave, onShare, onViewOriginal }: ActionBarProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onSave}
        style={({ pressed }) => pressed && styles.actionPressed}
        accessibilityLabel={isSaved ? 'Remove from saved' : 'Save article'}
        accessibilityRole="button"
      >
        <Text style={[styles.actionText, isSaved && styles.actionActive]}>
          {isSaved ? 'Saved' : 'Save'}
        </Text>
      </Pressable>

      <Text style={styles.separator}>|</Text>

      <Pressable
        onPress={onShare}
        style={({ pressed }) => pressed && styles.actionPressed}
        accessibilityLabel="Share article"
        accessibilityRole="button"
      >
        <Text style={styles.actionText}>Share</Text>
      </Pressable>

      <Text style={styles.separator}>|</Text>

      <Pressable
        onPress={onViewOriginal}
        style={({ pressed }) => pressed && styles.actionPressed}
        accessibilityLabel="View original article"
        accessibilityRole="link"
      >
        <Text style={styles.actionText}>Original article</Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textMuted,
    },
    actionActive: {
      color: colors.accentSecondary,
    },
    actionPressed: {
      opacity: 0.5,
    },
    separator: {
      fontSize: 14,
      fontWeight: '300',
      color: colors.divider,
    },
  });
}
