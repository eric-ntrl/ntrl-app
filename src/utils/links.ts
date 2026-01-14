import { Linking } from 'react-native';
import { validateUrl, isAllowedNewsDomain } from './urlValidator';

/**
 * Safely open an external URL with fallback handling.
 * Returns true if opened successfully, false otherwise.
 *
 * @param url - The URL to open
 * @param fallbackUrl - Optional fallback URL if primary fails
 * @param options - Options for URL validation
 */
export async function openExternalUrl(
  url: string | undefined,
  fallbackUrl?: string,
  options: { requireWhitelist?: boolean } = {}
): Promise<boolean> {
  const { requireWhitelist = false } = options;

  // Validate URL exists
  if (!url || url.trim() === '') {
    if (fallbackUrl) {
      return openExternalUrl(fallbackUrl, undefined, options);
    }
    return false;
  }

  // Validate URL structure and optionally domain whitelist
  const validation = validateUrl(url, { allowLocalhost: true });
  if (!validation.valid) {
    console.warn('[Links] Invalid URL:', url, 'Reason:', validation.reason);
    if (fallbackUrl) {
      return openExternalUrl(fallbackUrl, undefined, options);
    }
    return false;
  }

  // Optional domain whitelist check
  if (requireWhitelist && !isAllowedNewsDomain(url)) {
    console.warn('[Links] URL domain not in whitelist:', url);
    if (fallbackUrl) {
      return openExternalUrl(fallbackUrl, undefined, options);
    }
    return false;
  }

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else if (fallbackUrl) {
      return openExternalUrl(fallbackUrl, undefined, options);
    }
    return false;
  } catch (error) {
    console.warn('[Links] Failed to open URL:', url, error);
    if (fallbackUrl) {
      return openExternalUrl(fallbackUrl, undefined, options);
    }
    return false;
  }
}

/**
 * Format a source name for display in links
 */
export function formatSourceForLink(source: string): string {
  return source.trim();
}
