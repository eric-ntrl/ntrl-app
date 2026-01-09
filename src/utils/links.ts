import { Linking, Alert } from 'react-native';

/**
 * Safely open an external URL with fallback handling.
 * Returns true if opened successfully, false otherwise.
 */
export async function openExternalUrl(
  url: string | undefined,
  fallbackUrl?: string
): Promise<boolean> {
  // Validate URL exists
  if (!url || url.trim() === '') {
    if (fallbackUrl) {
      return openExternalUrl(fallbackUrl);
    }
    return false;
  }

  // Basic URL validation
  if (!isValidUrl(url)) {
    if (fallbackUrl) {
      return openExternalUrl(fallbackUrl);
    }
    return false;
  }

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else if (fallbackUrl) {
      return openExternalUrl(fallbackUrl);
    }
    return false;
  } catch (error) {
    console.warn('Failed to open URL:', url, error);
    if (fallbackUrl) {
      return openExternalUrl(fallbackUrl);
    }
    return false;
  }
}

/**
 * Basic URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Format a source name for display in links
 */
export function formatSourceForLink(source: string): string {
  return source.trim();
}
