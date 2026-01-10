/**
 * TEMPORARY: Simple RSS parser for dev article ingestion.
 * Remove once backend is connected.
 *
 * This is a lightweight XML parser that extracts RSS items without
 * requiring external dependencies. Works in React Native.
 */

export interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid?: string;
}

/**
 * Extract text content between XML tags
 */
function extractTagContent(xml: string, tagName: string): string {
  // Handle CDATA sections
  const cdataPattern = new RegExp(
    `<${tagName}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tagName}>`,
    'i'
  );
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }

  // Handle regular content
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xml.match(pattern);
  if (match) {
    // Strip any remaining HTML tags and decode entities
    return decodeEntities(match[1].replace(/<[^>]*>/g, '').trim());
  }

  return '';
}

/**
 * Decode common HTML entities
 */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

/**
 * Parse RSS XML string into array of items
 */
export function parseRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Split by <item> tags
  const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi);

  if (!itemMatches) {
    return items;
  }

  for (const itemXml of itemMatches) {
    const title = extractTagContent(itemXml, 'title');
    const description = extractTagContent(itemXml, 'description');
    const link = extractTagContent(itemXml, 'link');
    const pubDate = extractTagContent(itemXml, 'pubDate');
    const guid = extractTagContent(itemXml, 'guid');

    if (title && link) {
      items.push({
        title,
        description: description || '',
        link,
        pubDate,
        guid: guid || link,
      });
    }
  }

  return items;
}

/**
 * Fetch and parse RSS feed from URL
 */
export async function fetchRSS(url: string): Promise<RSSItem[]> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml',
      'User-Agent': 'NTRL-App/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`RSS fetch failed: ${response.status}`);
  }

  const xml = await response.text();
  return parseRSS(xml);
}
