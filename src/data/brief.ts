import briefJson from './brief.json';
import type { Brief, Item } from '../types';
import { getDevArticles, DEV_MODE } from '../dev/devArticleProvider';

/**
 * Static brief data from JSON (fallback when not in dev mode)
 */
export const staticBrief = briefJson as Brief;

/**
 * Get articles - either from dev provider (DEV_MODE) or static JSON
 */
export async function getArticles(): Promise<Item[]> {
  if (DEV_MODE) {
    return getDevArticles();
  }
  // Flatten static brief into items
  return staticBrief.sections.flatMap((section) => section.items);
}

/**
 * Wrap articles into a Brief structure with single "Today" section
 */
export function createBriefFromArticles(articles: Item[]): Brief {
  return {
    generated_at: new Date().toISOString(),
    sections: [
      {
        key: 'today',
        title: 'Today',
        items: articles,
      },
    ],
  };
}

/**
 * Check if we're in dev mode
 */
export { DEV_MODE };

export default staticBrief;
