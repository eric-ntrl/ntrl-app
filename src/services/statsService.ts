/**
 * Stats Service
 *
 * Handles reading session tracking, span aggregation, and stats computation
 * for the My Stats / Manipulation Avoided dashboard.
 */

import type {
  ReadingSession,
  ArticleSpanCache,
  UserStats,
  StatsTimeRange,
} from '../storage/types';
import type { SpanReason } from '../navigation/types';
import {
  getReadingSessions,
  addReadingSession,
  getArticleSpanCache,
  getArticleSpanCacheEntry,
  setArticleSpanCacheEntry,
  getUserStats,
  setUserStats,
} from '../storage/storageService';
import { fetchTransparency } from '../api';
import {
  getLocalDateString,
  parseLocalDateString,
  startOfDay,
  startOfWeek,
  startOfMonth,
  addDays,
  getDateRange,
  formatHour,
  formatWeekday,
  formatDayOfMonth,
  isWithinRange,
} from '../utils/dateHelpers';

// ============================================
// Types
// ============================================

export type StatsOverview = {
  ntrlDays: number;
  totalSessions: number;
  ntrlMinutes: number;
  phrasesAvoided: number;
};

export type SeriesDataPoint = {
  label: string;
  value: number;
  date: Date;
};

export type CategoryCount = {
  reason: SpanReason;
  count: number;
  label: string;
};

export type StatsBreakdown = {
  total: number;
  series: SeriesDataPoint[];
  categories: CategoryCount[];
  isEmpty: boolean;
};

// Human-readable labels for SpanReason
const REASON_LABELS: Record<SpanReason, string> = {
  clickbait: 'Clickbait',
  urgency_inflation: 'Urgency & hype',
  emotional_trigger: 'Emotional language',
  selling: 'Promotional language',
  agenda_signaling: 'Agenda signaling',
  rhetorical_framing: 'Rhetorical framing',
  editorial_voice: 'Editorial opinion',
};

// ============================================
// Session Recording
// ============================================

/**
 * Record a reading session and update aggregated stats.
 * If session is completed, fetches transparency data to count spans.
 */
export async function recordReadingSession(session: ReadingSession): Promise<void> {
  // Store the session
  await addReadingSession(session);

  // Only fetch/cache spans for completed sessions
  if (session.completed) {
    await updateStatsForSession(session);
  }
}

/**
 * Update user stats when a session is completed.
 * Fetches transparency data if not cached, updates aggregates.
 */
async function updateStatsForSession(session: ReadingSession): Promise<void> {
  try {
    // Get or fetch span data for this article
    let spanData = await getArticleSpanCacheEntry(session.storyId);

    if (!spanData) {
      // Fetch transparency data from API
      try {
        const transparency = await fetchTransparency(session.storyId);
        spanData = buildSpanCache(session.storyId, transparency.spans);
        await setArticleSpanCacheEntry(spanData);
      } catch (error) {
        // Transparency fetch failed - record session without span data
        console.warn('[Stats] Failed to fetch transparency for stats:', error);
        spanData = {
          storyId: session.storyId,
          spanCount: 0,
          byReason: {},
          cachedAt: new Date().toISOString(),
        };
      }
    }

    // Update user stats
    const stats = await getUserStats();

    // Add date to ntrlDays if not already present
    if (!stats.ntrlDays.includes(session.localDate)) {
      stats.ntrlDays.push(session.localDate);
    }

    // Update totals
    stats.totalSessions += 1;
    stats.totalDurationSeconds += session.durationSeconds;
    stats.totalSpans += spanData.spanCount;

    // Update by-reason counts
    for (const [reason, count] of Object.entries(spanData.byReason)) {
      const r = reason as SpanReason;
      stats.totalByReason[r] = (stats.totalByReason[r] || 0) + (count || 0);
    }

    // Set first session date if not set
    if (!stats.firstSessionDate) {
      stats.firstSessionDate = session.localDate;
    }

    stats.lastUpdatedAt = new Date().toISOString();

    await setUserStats(stats);
  } catch (error) {
    console.warn('[Stats] Failed to update stats for session:', error);
  }
}

/**
 * Build span cache entry from transparency spans.
 */
function buildSpanCache(
  storyId: string,
  spans: Array<{ reason: string }>
): ArticleSpanCache {
  const byReason: Partial<Record<SpanReason, number>> = {};

  for (const span of spans) {
    const reason = span.reason.toLowerCase() as SpanReason;
    byReason[reason] = (byReason[reason] || 0) + 1;
  }

  return {
    storyId,
    spanCount: spans.length,
    byReason,
    cachedAt: new Date().toISOString(),
  };
}

// ============================================
// Stats Retrieval
// ============================================

/**
 * Get overview stats for the My Stats card.
 */
export async function getUserStatsOverview(): Promise<StatsOverview> {
  const stats = await getUserStats();

  return {
    ntrlDays: stats.ntrlDays.length,
    totalSessions: stats.totalSessions,
    ntrlMinutes: Math.round(stats.totalDurationSeconds / 60),
    phrasesAvoided: stats.totalSpans,
  };
}

/**
 * Get detailed stats breakdown for a time range.
 */
export async function getStatsBreakdown(
  range: StatsTimeRange,
  anchorDate: Date = new Date()
): Promise<StatsBreakdown> {
  const sessions = await getReadingSessions();
  const spanCache = await getArticleSpanCache();

  // Create a lookup map for span cache
  const spanLookup = new Map<string, ArticleSpanCache>();
  for (const entry of spanCache) {
    spanLookup.set(entry.storyId, entry);
  }

  // Filter sessions by range
  const { start, end } = getDateRangeForStats(range, anchorDate);
  const filteredSessions = sessions.filter((s) => {
    if (!s.completed) return false;
    const sessionDate = parseLocalDateString(s.localDate);
    return isWithinRange(sessionDate, start, end);
  });

  if (filteredSessions.length === 0) {
    return {
      total: 0,
      series: generateEmptySeries(range, anchorDate),
      categories: [],
      isEmpty: true,
    };
  }

  // Count spans for filtered sessions
  let total = 0;
  const categoryTotals: Partial<Record<SpanReason, number>> = {};

  for (const session of filteredSessions) {
    const cached = spanLookup.get(session.storyId);
    if (cached) {
      total += cached.spanCount;
      for (const [reason, count] of Object.entries(cached.byReason)) {
        const r = reason as SpanReason;
        categoryTotals[r] = (categoryTotals[r] || 0) + (count || 0);
      }
    }
  }

  // Build series data
  const series = generateSeries(filteredSessions, spanLookup, range, anchorDate);

  // Build category breakdown (sorted by count descending)
  const categories: CategoryCount[] = Object.entries(categoryTotals)
    .filter(([_, count]) => count > 0)
    .map(([reason, count]) => ({
      reason: reason as SpanReason,
      count: count!,
      label: REASON_LABELS[reason as SpanReason] || reason,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    series,
    categories,
    isEmpty: false,
  };
}

/**
 * Get date range bounds for a stats time range.
 */
function getDateRangeForStats(
  range: StatsTimeRange,
  anchorDate: Date
): { start: Date; end: Date } {
  const today = startOfDay(anchorDate);

  switch (range) {
    case 'day':
      return { start: today, end: today };
    case 'week':
      return { start: startOfWeek(anchorDate), end: today };
    case 'month':
      return { start: startOfMonth(anchorDate), end: today };
    case 'all':
    default:
      // For all-time, go back to the earliest possible date
      return { start: new Date(2020, 0, 1), end: today };
  }
}

/**
 * Generate empty series data for a time range (for empty state).
 */
function generateEmptySeries(
  range: StatsTimeRange,
  anchorDate: Date
): SeriesDataPoint[] {
  const { start, end } = getDateRangeForStats(range, anchorDate);

  switch (range) {
    case 'day':
      // 24 hours
      return Array.from({ length: 24 }, (_, i) => {
        const d = new Date(start);
        d.setHours(i);
        return { label: formatHour(d), value: 0, date: d };
      });
    case 'week':
      // 7 days
      return getDateRange(start, end).map((d) => ({
        label: formatWeekday(d),
        value: 0,
        date: d,
      }));
    case 'month':
      // All days in month range
      return getDateRange(start, end).map((d) => ({
        label: formatDayOfMonth(d),
        value: 0,
        date: d,
      }));
    case 'all':
    default:
      // Empty for all-time (no data yet)
      return [];
  }
}

/**
 * Generate series data from sessions for visualization.
 */
function generateSeries(
  sessions: ReadingSession[],
  spanLookup: Map<string, ArticleSpanCache>,
  range: StatsTimeRange,
  anchorDate: Date
): SeriesDataPoint[] {
  const { start, end } = getDateRangeForStats(range, anchorDate);

  // Group spans by time bucket
  const bucketCounts = new Map<string, number>();

  for (const session of sessions) {
    const cached = spanLookup.get(session.storyId);
    if (!cached) continue;

    const sessionDate = parseLocalDateString(session.localDate);
    const bucketKey = getBucketKey(sessionDate, range);

    bucketCounts.set(
      bucketKey,
      (bucketCounts.get(bucketKey) || 0) + cached.spanCount
    );
  }

  // Build series with all buckets
  switch (range) {
    case 'day': {
      // 24 hours
      const series: SeriesDataPoint[] = [];
      for (let h = 0; h < 24; h++) {
        const d = new Date(start);
        d.setHours(h);
        const key = `hour-${h}`;
        series.push({
          label: formatHour(d),
          value: bucketCounts.get(key) || 0,
          date: d,
        });
      }
      return series;
    }
    case 'week': {
      // 7 days
      return getDateRange(start, end).map((d) => {
        const key = getLocalDateString(d);
        return {
          label: formatWeekday(d),
          value: bucketCounts.get(key) || 0,
          date: d,
        };
      });
    }
    case 'month': {
      // Days in month
      return getDateRange(start, end).map((d) => {
        const key = getLocalDateString(d);
        return {
          label: formatDayOfMonth(d),
          value: bucketCounts.get(key) || 0,
          date: d,
        };
      });
    }
    case 'all':
    default: {
      // Group by month for all-time
      const monthBuckets = new Map<string, { date: Date; value: number }>();

      for (const session of sessions) {
        const cached = spanLookup.get(session.storyId);
        if (!cached) continue;

        const sessionDate = parseLocalDateString(session.localDate);
        const monthKey = `${sessionDate.getFullYear()}-${sessionDate.getMonth()}`;

        if (!monthBuckets.has(monthKey)) {
          monthBuckets.set(monthKey, {
            date: new Date(sessionDate.getFullYear(), sessionDate.getMonth(), 1),
            value: 0,
          });
        }
        monthBuckets.get(monthKey)!.value += cached.spanCount;
      }

      // Sort by date and return
      return Array.from(monthBuckets.values())
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((bucket) => ({
          label: `${bucket.date.toLocaleDateString('en-US', { month: 'short' })}`,
          value: bucket.value,
          date: bucket.date,
        }));
    }
  }
}

/**
 * Get bucket key for a date based on time range granularity.
 */
function getBucketKey(date: Date, range: StatsTimeRange): string {
  switch (range) {
    case 'day':
      return `hour-${date.getHours()}`;
    case 'week':
    case 'month':
      return getLocalDateString(date);
    case 'all':
    default:
      return `${date.getFullYear()}-${date.getMonth()}`;
  }
}
