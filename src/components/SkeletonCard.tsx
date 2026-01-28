/**
 * Static skeleton loading placeholder for article cards.
 * No shimmer animation — static shapes matching card layout.
 * Used for first-load only on Today/Sections screens.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

/**
 * A single static skeleton card matching article card layout.
 * Title line, body lines, metadata line — all at low opacity.
 */
export default function SkeletonCard() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      {/* Title lines */}
      <View style={[styles.line, styles.titleLine]} />
      <View style={[styles.line, styles.titleLineShort]} />
      {/* Body lines */}
      <View style={[styles.line, styles.bodyLine]} />
      <View style={[styles.line, styles.bodyLine]} />
      <View style={[styles.line, styles.bodyLineShort]} />
      {/* Metadata line */}
      <View style={[styles.line, styles.metaLine]} />
    </View>
  );
}

/**
 * Multiple skeleton cards grouped under a section header placeholder.
 */
export function SkeletonSection({ count = 3 }: { count?: number }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View style={[styles.line, styles.sectionLine]} />
      </View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    card: {
      paddingTop: spacing.lg,
      paddingBottom: 26,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    line: {
      backgroundColor: colors.divider,
      borderRadius: 4,
      marginBottom: spacing.sm,
    },
    titleLine: {
      height: 18,
      width: '100%',
    },
    titleLineShort: {
      height: 18,
      width: '70%',
      marginBottom: spacing.md,
    },
    bodyLine: {
      height: 14,
      width: '100%',
    },
    bodyLineShort: {
      height: 14,
      width: '55%',
      marginBottom: spacing.md,
    },
    metaLine: {
      height: 10,
      width: '30%',
      marginBottom: 0,
    },
    sectionHeader: {
      marginTop: 28,
      marginBottom: spacing.lg,
    },
    sectionLine: {
      height: 10,
      width: 70,
      marginBottom: 0,
    },
  });
}
