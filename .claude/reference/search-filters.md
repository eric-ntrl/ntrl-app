# Search & Filters

SearchScreen provides full-text article search with filtering capabilities.

## Pre-Search UI

When the search screen opens (before typing), it displays:
- **TRENDING TOPICS**: Fetched from `/v1/topics/trending` API with article counts (e.g., "Grammy Awards (8)")
- **Saved Searches**: User's bookmarked search queries
- **Recent Searches**: Previously executed searches

Tapping a trending topic executes a search for that term.

## Filter Sheet

The filter sheet (`SearchFilterSheet.tsx`) provides filtering options:

| Section | Options |
|---------|---------|
| Sort By | Relevance, Most recent |
| Date Range | 24h, Week, Month, All time |
| Categories | All 10 feed categories (multi-select) |
| Publishers | From search facets with counts (multi-select) |

**Key design decisions:**
- Categories and Publishers are always visible (no mode toggle)
- Filters persist across sessions via `storageService.ts`
- Filter badge shows count of active filters

## Filter State (`SearchFiltersV2`)

```typescript
type SearchFiltersV2 = {
  categories: string[];   // Selected category keys
  sources: string[];      // Selected publisher slugs
  dateRange: DateRangePreset; // '24h' | 'week' | 'month' | 'all'
  sort: 'relevance' | 'recency';
};
```

## Related Files

| File | Purpose |
|------|---------|
| `src/screens/SearchScreen.tsx` | Main search screen with results |
| `src/components/search/SearchFilterSheet.tsx` | Filter bottom sheet |
| `src/api/topics.ts` | Trending topics API client |
| `src/api/search.ts` | Search API client |
| `src/types/search.ts` | Search type definitions |
