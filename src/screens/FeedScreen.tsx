import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import brief from '../data/brief';
import { colors, typography, spacing, layout } from '../theme';
import type { Item, Section, Brief } from '../types';

type Props = { navigation: any };

type Row =
  | { type: 'section'; section: Section }
  | { type: 'item'; item: Item; sectionKey: string }
  | { type: 'endOfFeed' };

function flatten(b: Brief): Row[] {
  const rows: Row[] = [];
  for (const s of b.sections) {
    rows.push({ type: 'section', section: s });
    for (const it of s.items) {
      rows.push({ type: 'item', item: it, sectionKey: s.key });
    }
  }
  rows.push({ type: 'endOfFeed' });
  return rows;
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function Header({ onInfoPress }: { onInfoPress: () => void }) {
  const today = formatDate(new Date());

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>NTRL</Text>
        <Text style={styles.date}>{today}</Text>
      </View>
      <Pressable
        onPress={onInfoPress}
        style={({ pressed }) => [
          styles.infoButton,
          pressed && styles.infoButtonPressed,
        ]}
        hitSlop={12}
      >
        <Text style={styles.infoText}>About</Text>
      </Pressable>
    </View>
  );
}

function SectionHeader({ section }: { section: Section }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
    </View>
  );
}

function ArticleCard({
  item,
  onPress,
}: {
  item: Item;
  onPress: () => void;
}) {
  const timeAgo = formatRelativeTime(item.published_at);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.headline} numberOfLines={2}>
        {item.headline}
      </Text>
      <Text style={styles.summary} numberOfLines={3}>
        {item.summary}
      </Text>
      <Text style={styles.meta}>
        {item.source} · {timeAgo}
      </Text>
    </Pressable>
  );
}

function EndOfFeed() {
  const today = formatDate(new Date());

  return (
    <View style={styles.endOfFeed}>
      <View style={styles.endDivider} />
      <Text style={styles.endMessage}>You're all caught up</Text>
      <Text style={styles.endDate}>Today · {today}</Text>
    </View>
  );
}

export default function FeedScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const rows = flatten(brief);

  const renderItem = ({ item }: { item: Row }) => {
    if (item.type === 'section') {
      return <SectionHeader section={item.section} />;
    }

    if (item.type === 'endOfFeed') {
      return <EndOfFeed />;
    }

    return (
      <ArticleCard
        item={item.item}
        onPress={() => navigation.navigate('ArticleDetail', { item: item.item })}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Header onInfoPress={() => navigation.navigate('Transparency')} />
      <FlatList
        data={rows}
        keyExtractor={(r, idx) =>
          r.type === 'section'
            ? `s-${r.section.key}`
            : r.type === 'endOfFeed'
            ? 'end-of-feed'
            : `${r.item.id}-${idx}`
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  brand: {
    ...typography.brand,
    color: colors.textPrimary,
  },
  date: {
    ...typography.date,
    marginTop: spacing.xs,
  },
  infoButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  infoButtonPressed: {
    opacity: 0.5,
  },
  infoText: {
    ...typography.link,
    fontSize: 13,
  },

  // List
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxxl,
  },

  // Section header
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  sectionTitle: {
    ...typography.sectionHeader,
  },

  // Article card
  card: {
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  cardPressed: {
    opacity: 0.7,
  },
  headline: {
    ...typography.headline,
    marginBottom: spacing.sm,
  },
  summary: {
    ...typography.summary,
    marginBottom: spacing.md,
  },
  meta: {
    ...typography.meta,
  },

  // End of feed
  endOfFeed: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  endDivider: {
    width: 40,
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: spacing.lg,
  },
  endMessage: {
    ...typography.endMessage,
    marginBottom: spacing.xs,
  },
  endDate: {
    ...typography.endDate,
  },
});
