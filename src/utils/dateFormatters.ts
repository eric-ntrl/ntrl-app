/**
 * Unified date formatting utilities.
 * Consolidates duplicate formatting functions from across screens.
 */

/**
 * Format a date for header display: "Wednesday, January 8"
 */
export function formatHeaderDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Ensure UTC parsing for API timestamps.
 * API returns UTC timestamps without 'Z' suffix.
 */
function ensureUtcParsing(dateString: string): Date {
  const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  return new Date(utcString);
}

/**
 * Format relative time for feed items (within 24h window).
 * Used for article timestamps in feeds.
 *
 * @param dateString - ISO date string from API
 * @param now - Reference time for calculating diff (defaults to current time)
 * @returns Formatted string like "Just now", "5m ago", "2h ago"
 */
export function formatRelativeTime(dateString: string, now: Date = new Date()): string {
  const date = ensureUtcParsing(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return 'Today';
}

/**
 * Format time for history/saved items with extended range.
 * Includes "Yesterday" and falls back to date for older items.
 *
 * @param dateString - ISO date string
 * @returns Formatted string like "Just now", "5m ago", "Yesterday", "Jan 15"
 */
export function formatExtendedRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format time for article updates/modifications.
 * Falls back to full date for older items.
 *
 * @param dateString - ISO date string
 * @returns Formatted string like "Just now", "5m ago", "Jan 15 at 3:45 PM"
 */
export function formatUpdateTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Get current time formatted for display.
 * Useful for "last updated" timestamps.
 */
export function formatCurrentTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
