import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

type Props = {
  /** Plain text with paragraph breaks (\n\n) from backend */
  text: string;
};

/**
 * ArticleBrief - Renders article brief as calm, readable paragraphs
 *
 * RENDERING RULES:
 * - 3-5 paragraphs, headerless
 * - No section headers, bullets, or dividers
 * - Generous paragraph spacing for calm reading
 * - Quotes embedded in prose (no blockquote styling)
 * - Must feel complete; no "read more"
 *
 * DATA CONTRACT:
 * - Receives brief_text as plain text with paragraph breaks
 * - Preserves paragraph breaks; does not auto-bullet or auto-title
 */
export default function ArticleBrief({ text }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Split on double newlines (paragraph breaks)
  // Also handle \r\n for cross-platform compatibility
  const paragraphs = text
    .split(/\n\n+|\r\n\r\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // If no paragraph breaks, treat single newlines as soft breaks within prose
  // but render as single block
  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {paragraphs.map((paragraph, index) => (
        <Text key={index} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    container: {
      // No extra container styling - let parent control margins
    },
    paragraph: {
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
      letterSpacing: typography.body.letterSpacing,
      color: typography.body.color,
      marginBottom: typography.body.lineHeight, // Paragraph spacing = line-height for calm rhythm
    },
  });
}
