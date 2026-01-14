# NTRL Data Flow

This document describes how data flows through the NTRL application.

## Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          NTRL Backend API                           │
│                   (FastAPI / Python / Railway)                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           API Client                                │
│                         (src/api.ts)                                │
│                                                                     │
│  • fetchBrief() / fetchBriefWithCache()                            │
│  • fetchStoryDetail()                                              │
│  • fetchTransparency()                                             │
│  • Retry logic with exponential backoff                            │
│  • Response transformation                                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
     ┌──────────┐           ┌──────────────┐        ┌─────────────┐
     │  Cache   │           │   Screens    │        │   Storage   │
     │(in-mem)  │           │              │        │(AsyncStore) │
     └──────────┘           └──────────────┘        └─────────────┘
```

## Main Data Flows

### 1. Daily Brief Loading (FeedScreen)

```
User opens app
       │
       ▼
┌──────────────────┐
│ FeedScreen       │
│ useEffect()      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ fetchBriefWith   │
│ Cache()          │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────────┐
│Network│ │Check Cache│
│Fetch  │ │(fallback) │
└───┬───┘ └─────┬─────┘
    │           │
    │    (on network failure)
    │           │
    ▼           │
┌───────────────┴───────────────┐
│       Transform Response      │
│   ApiBriefResponse → Brief    │
└───────────────┬───────────────┘
                │
                ▼
        ┌───────────────┐
        │ Cache Brief   │
        │ (fire-forget) │
        └───────────────┘
                │
                ▼
        ┌───────────────┐
        │ Render Feed   │
        │ with sections │
        └───────────────┘
```

### 2. Article Detail Loading (ArticleDetailScreen)

```
User taps article in Feed
           │
           ▼
┌─────────────────────────┐
│ Navigate to             │
│ ArticleDetailScreen     │
│ with { item: Item }     │
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌────────────┐  ┌────────────┐
│ Show item  │  │ fetchStory │
│ headline & │  │ Detail()   │
│ summary    │  └──────┬─────┘
└────────────┘         │
                       ▼
               ┌──────────────┐
               │ ApiStory     │
               │ Detail       │
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │ Transform    │
               │ to Detail    │
               │ • what_happened
               │ • why_matters│
               │ • known[]    │
               │ • uncertain[]│
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │ Render full  │
               │ article view │
               └──────────────┘
```

### 3. Reader Mode / NTRL View (NtrlViewScreen)

```
User taps "Read" button
           │
           ▼
┌─────────────────────────┐
│ Navigate to             │
│ NtrlViewScreen          │
│ with { item, url }      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ getReadableArticle()    │
│ (readerMode.ts)         │
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌────────┐    ┌──────────┐
│ Check  │    │ Fetch    │
│ Memory │    │ URL      │
│ Cache  │    │ (12s TO) │
└────────┘    └────┬─────┘
                   │
                   ▼
           ┌──────────────┐
           │ Extract Text │
           │ Strategies:  │
           │ 1. <article> │
           │ 2. <main>    │
           │ 3. CSS class │
           │ 4. <p> tags  │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │ Score & Pick │
           │ Best Result  │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │ Calculate    │
           │ Quality      │
           │ Metrics      │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │ Cache Result │
           │ (6hr TTL)    │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │ Render Clean │
           │ Article Text │
           └──────────────┘
```

### 4. Transparency / Redline View (RedlineScreen)

```
User taps "Transparency" button
           │
           ▼
┌─────────────────────────┐
│ Navigate to             │
│ RedlineScreen           │
│ with { item, text }     │
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌────────────┐  ┌────────────────┐
│ fetchTrans │  │ findRedlines() │
│ parency()  │  │ (local detect) │
└──────┬─────┘  └───────┬────────┘
       │                │
       ▼                ▼
┌──────────────┐ ┌───────────────┐
│ API removed  │ │ Detected spans│
│ phrases[]    │ │ with positions│
└──────┬───────┘ └───────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
        ┌───────────────┐
        │ Merge Results │
        │ API + Local   │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ Render with   │
        │ highlighted   │
        │ spans         │
        └───────────────┘
```

### 5. Saving Articles (SavedArticlesScreen)

```
User taps "Save" button
           │
           ▼
┌─────────────────────────┐
│ saveArticle(item)       │
│ (storageService.ts)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Get current saved list  │
│ from AsyncStorage       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Add item with timestamp │
│ Check MAX_SAVED (100)   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Write back to           │
│ AsyncStorage            │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Show success toast      │
└─────────────────────────┘

---

User opens SavedArticlesScreen
           │
           ▼
┌─────────────────────────┐
│ getSavedArticles()      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Read from AsyncStorage  │
│ Parse JSON              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Sort by savedAt desc    │
│ Render FlatList         │
└─────────────────────────┘
```

### 6. Reading History (HistoryScreen)

```
User views article
       │
       ▼
┌──────────────────┐
│ addToHistory()   │
│ (automatic)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Get current      │
│ history list     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Add/update item  │
│ with timestamp   │
│ MAX_HISTORY: 50  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Write to         │
│ AsyncStorage     │
└──────────────────┘
```

## Storage Keys

| Key | Contents | Limit |
|-----|----------|-------|
| `ntrl_saved_articles` | Saved items array | 100 items |
| `ntrl_history` | Reading history array | 50 items |
| `ntrl_preferences` | User preferences (SecureStore) | N/A |
| `ntrl_brief_cache` | Cached daily brief | 24hr TTL |
| `ntrl_recent_searches` | Recent search terms | 10 items |

## Cache Strategy

### Brief Cache (API Level)
- **Storage**: AsyncStorage
- **TTL**: 24 hours
- **Behavior**: Fetch fresh → cache → fallback to cached on network failure

### Reader Mode Cache (Service Level)
- **Storage**: In-memory Map
- **TTL**: 6 hours
- **Behavior**: Check cache → fetch if miss → cache result
- **Note**: Cleared on app restart

### Retry Strategy (API Level)
- **Max Retries**: 3
- **Backoff**: Exponential (1s, 2s, 4s)
- **Retry On**: Network errors, 5xx responses, timeouts
- **No Retry**: 4xx client errors

## Type Transformations

### API Response → App Types

```typescript
// API Response (from backend)
type ApiBriefResponse = {
  id: string;
  brief_date: string;
  cutoff_time: string;
  assembled_at: string;
  sections: ApiBriefSection[];
};

// App Type (used in screens)
type Brief = {
  generated_at: string;
  sections: Section[];
};

// Transformation
function transformBrief(api: ApiBriefResponse): Brief {
  return {
    generated_at: api.assembled_at,
    sections: api.sections.map(transformSection),
  };
}
```

## Error States

| Error | User Sees | Recovery |
|-------|-----------|----------|
| Network offline | Cached content + banner | Auto-retry on reconnect |
| API 5xx | Loading... then cached | Automatic retry (3x) |
| API 4xx | Error message | User action required |
| Extraction failed | "Source unavailable" | Fallback to summary |
| No cache available | Full error screen | Pull to refresh |
