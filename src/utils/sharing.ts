import { Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';

/**
 * NTRL App Link Configuration
 *
 * In production, this will be a universal link that:
 * - Opens the app if installed
 * - Falls back to app store if not installed
 */
const NTRL_BASE_URL = 'https://ntrl.news';

/**
 * Generate a shareable NTRL app link for a story
 */
export function getStoryShareUrl(storyId: string): string {
  return `${NTRL_BASE_URL}/story/${storyId}`;
}

/**
 * Copy story link to clipboard
 */
export async function copyStoryLink(storyId: string): Promise<void> {
  const url = getStoryShareUrl(storyId);
  await Clipboard.setStringAsync(url);
}

/**
 * Share targets with their URL schemes
 */
export type ShareTarget = 'messages' | 'email' | 'whatsapp' | 'twitter' | 'telegram';

export interface ShareTargetConfig {
  key: ShareTarget;
  label: string;
  icon: string;
  available: boolean;
}

/**
 * Build share URL for a specific target
 */
function buildShareUrl(
  target: ShareTarget,
  headline: string,
  url: string
): string {
  const text = encodeURIComponent(`${headline}\n\n${url}`);
  const encodedUrl = encodeURIComponent(url);
  const encodedHeadline = encodeURIComponent(headline);

  switch (target) {
    case 'messages':
      // iOS Messages
      return `sms:&body=${text}`;
    case 'email':
      return `mailto:?subject=${encodedHeadline}&body=${text}`;
    case 'whatsapp':
      return `whatsapp://send?text=${text}`;
    case 'twitter':
      return `twitter://post?message=${text}`;
    case 'telegram':
      return `tg://msg?text=${text}`;
    default:
      return '';
  }
}

/**
 * Check if a share target app is available
 */
export async function isShareTargetAvailable(target: ShareTarget): Promise<boolean> {
  const testUrls: Record<ShareTarget, string> = {
    messages: 'sms:',
    email: 'mailto:',
    whatsapp: 'whatsapp://',
    twitter: 'twitter://',
    telegram: 'tg://',
  };

  try {
    return await Linking.canOpenURL(testUrls[target]);
  } catch {
    return false;
  }
}

/**
 * Get available share targets
 */
export async function getAvailableShareTargets(): Promise<ShareTargetConfig[]> {
  const targets: Omit<ShareTargetConfig, 'available'>[] = [
    { key: 'messages', label: 'Messages', icon: '💬' },
    { key: 'email', label: 'Email', icon: '✉️' },
    { key: 'whatsapp', label: 'WhatsApp', icon: '📱' },
    { key: 'twitter', label: 'X / Twitter', icon: '𝕏' },
    { key: 'telegram', label: 'Telegram', icon: '✈️' },
  ];

  const results = await Promise.all(
    targets.map(async (t) => ({
      ...t,
      available: await isShareTargetAvailable(t.key),
    }))
  );

  return results;
}

/**
 * Share to a specific target app
 */
export async function shareToTarget(
  target: ShareTarget,
  storyId: string,
  headline: string
): Promise<boolean> {
  const url = getStoryShareUrl(storyId);
  const shareUrl = buildShareUrl(target, headline, url);

  try {
    const canOpen = await Linking.canOpenURL(shareUrl);
    if (canOpen) {
      await Linking.openURL(shareUrl);
      return true;
    }
    console.warn(`[Sharing] Cannot open ${target}`);
    return false;
  } catch (error) {
    console.error(`[Sharing] Failed to share to ${target}:`, error);
    return false;
  }
}
