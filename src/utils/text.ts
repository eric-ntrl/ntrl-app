/**
 * Safely convert a numeric codepoint to a character.
 * Returns empty string for invalid or dangerous codepoints.
 */
function safeCodePointToChar(codepoint: number): string {
  // Valid Unicode range: U+0000 to U+10FFFF
  // Exclude surrogate pairs range: U+D800 to U+DFFF (invalid in UTF-16)
  // Exclude null character and control characters that could cause issues
  if (
    codepoint <= 0 ||
    codepoint > 0x10ffff ||
    (codepoint >= 0xd800 && codepoint <= 0xdfff) ||
    codepoint === 0x0
  ) {
    return '';
  }

  try {
    return String.fromCodePoint(codepoint);
  } catch {
    // fromCodePoint can throw for invalid values
    return '';
  }
}

/**
 * Decode common HTML entities in text.
 * Safely handles numeric character references with proper bounds checking.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return text;

  return (
    text
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      // Decode decimal numeric entities (&#39;, &#8217;, etc.)
      .replace(/&#(\d+);/g, (_, code) => safeCodePointToChar(parseInt(code, 10)))
      // Decode hexadecimal numeric entities (&#x27;, &#x2019;, etc.)
      .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => safeCodePointToChar(parseInt(code, 16)))
  );
}
