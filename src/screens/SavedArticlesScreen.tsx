import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';
import { getSavedArticles, removeSavedArticle } from '../storage/storageService';
import { decodeHtmlEntities } from '../utils/text';
import type { SavedArticle } from '../storage/types';
import type { Item } from '../types';
import type { SavedArticlesScreenProps } from '../navigation/types';

/**
 * Format relative time for saved articles
 */
function formatSavedTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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
      <Text style={styles.headerTitle}>Saved Articles</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function ArticleCard({
  item,
  savedAt,
  onPress,
  onRemove,
  styles,
}: {
  item: Item;
  savedAt: string;
  onPress: () => void;
  onRemove: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const timeLabel = formatSavedTime(savedAt);
  const headline = decodeHtmlEntities(item.headline);
  const summary = decodeHtmlEntities(item.summary);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      onLongPress={onRemove}
      accessibilityLabel={`${headline}. Saved ${timeLabel}. Long press to remove.`}
      accessibilityRole="button"
    >
      <View style={styles.textColumn}>
        <Text style={styles.headline} numberOfLines={3} ellipsizeMode="tail">
          {headline}
        </Text>
        <Text style={styles.summary} numberOfLines={2} ellipsizeMode="tail">
          {summary}
        </Text>
        <Text style={styles.meta}>
          {item.source} · Saved {timeLabel}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>★</Text>
      <Text style={styles.emptyMessage}>No saved articles yet</Text>
      <Text style={styles.emptyHint}>
        Tap the bookmark icon on any article to save it for later.
      </Text>
    </View>
  );
}

function EndOfList({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.endOfList}>
      <View style={styles.endDivider} />
      <Text style={styles.endMessage}>End of saved articles</Text>
    </View>
  );
}

export default function SavedArticlesScreen({ navigation }: SavedArticlesScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSavedArticles = useCallback(async () => {
    const articles = await getSavedArticles();
    setSavedArticles(articles);
  }, []);

  // Load saved articles when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSavedArticles();
    }, [loadSavedArticles])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSavedArticles();
    setRefreshing(false);
  }, [loadSavedArticles]);

  const handleRemove = useCallback(async (itemId: string) => {
    await removeSavedArticle(itemId);
    setSavedArticles((prev) => prev.filter((s) => s.item.id !== itemId));
  }, []);

  const renderItem = ({ item }: { item: SavedArticle }) => (
    <ArticleCard
      item={item.item}
      savedAt={item.savedAt}
      onPress={() => navigation.navigate('ArticleDetail', { item: item.item })}
      onRemove={() => handleRemove(item.item.id)}
      styles={styles}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Header onBack={() => navigation.goBack()} styles={styles} />

      {savedArticles.length === 0 ? (
        <EmptyState styles={styles} />
      ) : (
        <FlatList
          data={savedArticles}
          keyExtractor={(item) => item.item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textMuted}
            />
          }
          ListFooterComponent={<EndOfList styles={styles} />}
        />
      )}
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

    // List
    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing.xxxl,
    },

    // Article card
    card: {
      paddingVertical: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    cardPressed: {
      opacity: 0.6,
    },
    textColumn: {
      flex: 1,
    },
    headline: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    summary: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 21,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    meta: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
    },

    // Empty state
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: layout.screenPadding,
    },
    emptyIcon: {
      fontSize: 32,
      color: colors.textSubtle,
      marginBottom: spacing.lg,
    },
    emptyMessage: {
      fontSize: 17,
      fontWeight: '500',
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    emptyHint: {
      fontSize: 15,
      fontWeight: '400',
      color: colors.textSubtle,
      textAlign: 'center',
      lineHeight: 22,
    },

    // End of list
    endOfList: {
      alignItems: 'center',
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xxl,
    },
    endDivider: {
      width: 48,
      height: 1,
      backgroundColor: colors.divider,
      marginBottom: spacing.xl,
    },
    endMessage: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textSubtle,
    },
  });
}
