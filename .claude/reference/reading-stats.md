# My Stats / Reading Stats

ProfileScreen includes a "MY STATS" section showing reading activity. Users can tap "Phrases Avoided" to see a detailed breakdown.

## Session Tracking

Reading sessions are tracked in `ArticleDetailScreen.tsx`:
- **Completion criteria**: Dwell time >=30s OR scroll depth >=75% (whichever first)
- Sessions recorded on component unmount via `recordReadingSession()`
- Transparency data fetched for completed sessions to count manipulation spans

## Storage Types (`storage/types.ts`)

| Type | Purpose | Limit |
|------|---------|-------|
| `ReadingSession` | Individual article reading sessions | 200 entries (rolling) |
| `ArticleSpanCache` | Cached span counts per article | 100 entries (LRU) |
| `UserStats` | Aggregated all-time totals | 1 entry (indefinite) |
| `StatsTimeRange` | Time filter: 'day' \| 'week' \| 'month' \| 'all' | — |

## Stats Service (`services/statsService.ts`)

| Function | Description |
|----------|-------------|
| `recordReadingSession(session)` | Store session, fetch spans if completed, update aggregates |
| `getUserStatsOverview()` | Returns `{ ntrlDays, totalSessions, ntrlMinutes, phrasesAvoided }` |
| `getStatsBreakdown(range, anchorDate)` | Returns `{ total, series[], categories[] }` for charts |

## UI Components (`components/stats/`)

| Component | Description |
|-----------|-------------|
| `MyStatsCard` | Hero "NTRL Days" + grid of Sessions/Minutes/Phrases Avoided |
| `StatBucket` | Reusable metric display (value + label), optionally tappable |
| `BarChart` | Simple vertical bars using react-native-svg, single neutral color |
| `CategoryBreakdownList` | Span counts by SpanReason with color swatches |
| `RangeSwitcher` | Day/Week/Month/All time selector wrapping SegmentedControl |

## Screens

- **ProfileScreen**: "MY STATS" section between "How NTRL Works" and "Your Content"
- **ManipulationAvoidedScreen**: Detail view with range switcher, bar chart, category breakdown

## Red-Line Compliance (CRITICAL)

The stats feature follows NTRL's calm UX principles:
- **No gamification**: No badges, levels, streaks, confetti
- **No urgency**: No "check back" prompts, no streak pressure
- **No good/bad colors**: Uses neutral accent color only
- **Calm copy**: "Start reading to see your stats.", "No reading activity in this period."
- **No social comparison**: No leaderboards

## Empty States

| Scenario | Display |
|----------|---------|
| New user (0 sessions) | All zeros + "Start reading to see your stats." |
| No data for selected range | "No reading activity in this period." |
| Sessions but 0 spans | Shows "0 phrases avoided" (not an error) |
