# NTRL App Architecture

This document describes the architecture and design decisions of the NTRL mobile application.

## Overview

NTRL is a React Native/Expo application that presents "neutralized" news content. The app strips manipulative language from articles, presents a calm deterministic feed, and provides transparency into what language was modified.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.81.5 + Expo 54 |
| Language | TypeScript 5.9 |
| Navigation | React Navigation (Native Stack) |
| Storage | AsyncStorage + expo-secure-store |
| Testing | Jest + React Testing Library |
| Linting | ESLint + Prettier |

## Directory Structure

```
ntrl-app/
├── App.js                 # Root component with navigation setup
├── src/
│   ├── api.ts             # Backend API client
│   ├── types.ts           # Core TypeScript interfaces
│   │
│   ├── config/            # Environment configuration
│   │   └── index.ts       # Environment-aware API_BASE_URL
│   │
│   ├── constants/         # Centralized constants
│   │   └── index.ts       # Animation, fetch, cache configs
│   │
│   ├── components/        # Reusable UI components
│   │   ├── ArticleBrief.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── SegmentedControl.tsx
│   │
│   ├── screens/           # App screens
│   │   ├── FeedScreen.tsx           # Main daily brief
│   │   ├── ArticleDetailScreen.tsx  # Full article view
│   │   ├── RedlineScreen.tsx        # Transparency view
│   │   ├── NtrlViewScreen.tsx       # Neutral reading mode
│   │   ├── ProfileScreen.tsx        # Settings & preferences
│   │   ├── SearchScreen.tsx         # Article search
│   │   ├── SavedArticlesScreen.tsx  # Saved items
│   │   ├── HistoryScreen.tsx        # Reading history
│   │   ├── SourceTransparencyScreen.tsx
│   │   └── AboutScreen.tsx
│   │
│   ├── services/          # Business logic
│   │   ├── readerMode.ts    # Article text extraction
│   │   ├── redline.ts       # Manipulative language detection
│   │   └── detailSummary.ts # Summary composition
│   │
│   ├── storage/           # Data persistence
│   │   ├── storageService.ts  # High-level storage API
│   │   ├── secureStorage.ts   # Encrypted storage wrapper
│   │   └── types.ts           # Storage type definitions
│   │
│   ├── theme/             # Design system
│   │   ├── index.tsx      # ThemeProvider + useTheme hook
│   │   ├── colors.ts      # Color palette (light/dark)
│   │   ├── typography.ts  # Font sizes & weights
│   │   ├── spacing.ts     # Spacing scale
│   │   └── types.ts       # Theme type definitions
│   │
│   ├── navigation/        # Navigation configuration
│   │   └── types.ts       # Typed navigation props
│   │
│   ├── utils/             # Helper utilities
│   │   ├── dateFormatters.ts  # Date/time formatting
│   │   ├── urlValidator.ts    # URL validation & whitelist
│   │   ├── text.ts            # Text processing
│   │   ├── links.ts           # URL handling
│   │   ├── sharing.ts         # Share functionality
│   │   └── logger.ts          # Environment-aware logging
│   │
│   ├── dev/               # Development utilities
│   │   ├── devArticleProvider.ts
│   │   ├── fallbackArticles.ts
│   │   └── rssParser.ts
│   │
│   └── data/              # Static data
│       └── brief.ts
│
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md    # This file
│   ├── DATA_FLOW.md       # Data flow diagrams
│   └── adr/               # Architecture Decision Records
│
└── assets/                # Static assets (images, fonts)
```

## Key Components

### API Layer (`src/api.ts`)

The API client handles all communication with the NTRL backend:

- **fetchBrief()** - Get daily news brief
- **fetchBriefWithCache()** - Cached version with offline fallback
- **fetchStoryDetail()** - Get full story details
- **fetchTransparency()** - Get removed phrases

Features:
- Automatic retry with exponential backoff (3 attempts, 1s/2s/4s delays)
- 10-second timeout per request
- Response transformation from API types to app types
- Cache-first strategy for offline support

### Services Layer

#### Reader Mode (`src/services/readerMode.ts`)

Extracts clean article text from URLs:
- Multiple extraction strategies (article, main, CSS classes, paragraphs)
- Scoring algorithm to select best content
- Boilerplate/CTA filtering
- In-memory caching (6-hour TTL)

#### Redline Detection (`src/services/redline.ts`)

Identifies manipulative language patterns:
- **Manipulative phrases**: "breaking", "shocking", "slams"
- **Promotional content**: "subscribe now", "click here"
- **Emphatic caps**: ALL CAPS words (excluding acronyms)
- **Excessive punctuation**: !!, ?!, ???

Returns spans with positions for UI highlighting.

### Theme System (`src/theme/`)

Context-based theme system supporting light/dark mode:

```typescript
// Usage in components
const { theme, colorMode } = useTheme();
const styles = useMemo(() => createStyles(theme), [theme]);
```

Key principles:
1. Never import static colors/spacing directly
2. Always use `useTheme()` hook
3. Create styles via `createStyles(theme: Theme)` function
4. Memoize styles with theme as dependency

### Storage Layer (`src/storage/`)

Two-tier storage approach:

| Store | Use Case | Implementation |
|-------|----------|----------------|
| AsyncStorage | Non-sensitive data (history, saved) | @react-native-async-storage |
| SecureStore | Sensitive data (preferences) | expo-secure-store |

## Navigation Structure

```
Stack Navigator (Native Stack)
├── Feed (Main)
├── ArticleDetail
│   └── Redline
│   └── NtrlView
│   └── SourceTransparency
├── Search
├── Profile
│   └── SavedArticles
│   └── History
│   └── About
```

All navigation props are typed via `src/navigation/types.ts`.

## Design Patterns

### Error Handling

- **ErrorBoundary** wraps the entire app to catch React errors
- API calls use try/catch with fallback to cached data
- Network failures trigger retry logic automatically

### State Management

The app uses React's built-in state management:
- **useState** for component-local state
- **useContext** for theme (via ThemeProvider)
- No Redux or external state library needed

### Performance Optimizations

1. **Memoization**: Styles created via `useMemo`
2. **Caching**: API responses and article extractions cached
3. **Lazy loading**: Screens loaded on navigation
4. **Animation cleanup**: Refs track mount state to prevent memory leaks

## Environment Configuration

Three environments supported via `src/config/index.ts`:

| Environment | API URL | Dev Mode |
|-------------|---------|----------|
| development | localhost:8000 | true |
| staging | api-staging-*.railway.app | false |
| production | api.ntrl.app | false |

Configured via `app.json` extras.

## Testing Strategy

```
src/
├── services/__tests__/
│   └── redline.test.ts    # Phrase detection tests
├── utils/__tests__/
│   ├── text.test.ts       # Text utility tests
│   └── urlValidator.test.ts
```

Run tests: `npm test`
Run with coverage: `npm run test:coverage`

## Code Quality

- **ESLint**: TypeScript + React + React Native rules
- **Prettier**: Consistent formatting
- **TypeScript strict mode**: Enabled in tsconfig.json

Run linting: `npm run lint`
Auto-fix: `npm run lint:fix`

## Security Considerations

1. **URL Validation**: All external URLs validated before fetch
2. **Secure Storage**: Sensitive data encrypted via expo-secure-store
3. **No secrets in code**: API URLs environment-configured
4. **Console logging disabled in production**: Via logger utility

## Backend/Frontend Separation

### Principle

NTRL follows a strict separation of concerns:

- **Backend (ntrl-api):** ALL ingestion, neutralization, and data processing
- **Frontend (ntrl-app):** Pure UI/presentation, consuming API data only

### Current Migration Status

| Feature | Backend Service | Frontend Service | Status |
|---------|----------------|------------------|--------|
| Article ingestion | `ingestion.py` → S3 | N/A | ✅ Backend only |
| Neutralization | `neutralizer.py` (4 LLM providers) | N/A | ✅ Backend only |
| Brief assembly | `brief_assembly.py` | N/A | ✅ Backend only |
| Full article text | `/v1/stories/{id}/transparency` | `readerMode.ts` (deprecated) | ⚠️ Backend preferred |
| Redline detection | `TransparencySpan` model | `redline.ts` (deprecated) | ⚠️ Backend preferred |

### Feature Flags

The app uses feature flags to control backend vs frontend service usage during the migration:

```typescript
// src/config/index.ts
export const FEATURE_FLAGS = {
  USE_BACKEND_FULL_TEXT: false,  // When true: uses backend API
  USE_BACKEND_REDLINES: false,   // When true: uses backend TransparencySpans
};
```

Set these flags to `true` once corresponding backend endpoints are production-ready.

### Deprecated Frontend Services

The following services are **placeholder/demo code** that will be replaced:

| Service | Purpose | Backend Replacement |
|---------|---------|---------------------|
| `src/services/readerMode.ts` | Client-side article extraction | `/v1/stories/{id}/transparency` or `/full-text` |
| `src/services/redline.ts` | Client-side manipulation detection | `/v1/stories/{id}/transparency` (TransparencySpan) |

**These services exist only for:**
1. Development/demo when backend is unavailable
2. Offline fallback (future consideration)
3. Gradual migration testing

**Do NOT extend these services.** All new features should use backend APIs.

### Backend Services (ntrl-api)

The backend provides robust infrastructure for content processing:

| Service | Purpose | Status |
|---------|---------|--------|
| `ingestion.py` | RSS feed → S3 + DB pipeline | ✅ Complete |
| `neutralizer.py` | LLM-based neutralization (4 providers + mock) | ✅ Complete |
| `auditor.py` | Output validation with retry | ✅ Complete |
| `classifier.py` | Section classification | ✅ Complete |
| `deduper.py` | Duplicate detection | ✅ Complete |
| `brief_assembly.py` | Deterministic brief assembly | ✅ Complete |
| `TransparencySpan` | Position-based removed phrase tracking | ⚠️ Partial (mock works, LLM parsing in progress) |

### Migration Plan

When backend endpoints are production-ready:

1. **Enable feature flags** in production config
2. **Monitor** for regressions
3. **Remove deprecated services** after 2-4 weeks of stable operation
4. **Simplify screens** to only use API data
