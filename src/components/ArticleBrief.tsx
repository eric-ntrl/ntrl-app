import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

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

const styles = StyleSheet.create({
  container: {
    // No extra container styling - let parent control margins
  },
  paragraph: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 28,              // 1.75x for book-like reading
    letterSpacing: 0.3,          // Subtle improvement for reading flow
    color: colors.textPrimary,
    marginBottom: 28,            // Paragraph spacing = line-height for calm rhythm
  },
});
