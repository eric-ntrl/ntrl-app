# NTRL App - Project Context

## What is NTRL?
A "neutral news" app that strips manipulative language from news articles and presents them in a calm, deterministic feed. No engagement metrics, no personalization, no urgency.

## Documentation

All project documentation lives in **ntrl-api** repo at `../ntrl-api/docs/`.

| Document | Description |
|----------|-------------|
| `../ntrl-api/docs/README.md` | Master index of all 28 documents |
| `../ntrl-api/docs/product/product-overview.md` | Product spec, 3-tab architecture |
| `../ntrl-api/docs/technical/architecture-overview.md` | System-wide architecture |
| `../ntrl-api/docs/team/onboarding-guide.md` | New team member setup |
| `../ntrl-api/docs/team/engineering-standards.md` | Code conventions, dark mode rules |

## Tech Stack
- **Framework:** React Native 0.81.5 with Expo 54
- **Language:** TypeScript 5.9
- **Navigation:** React Navigation (Native Stack)
- **Platforms:** iOS, Android (mobile-only)

## Project Structure
```
src/
├── screens/          # App screens
│   ├── TodayScreen.tsx          # Session-filtered articles (brand: "NTRL")
│   ├── SectionsScreen.tsx       # All category sections (brand: "NTRL")
│   ├── ArticleDetailScreen.tsx  # Article view with Brief/Full/Ntrl tabs
│   ├── NtrlViewScreen.tsx       # (Dead code) Legacy standalone transparency view
│   ├── ProfileScreen.tsx        # User content, topics, navigation to Settings
│   ├── SettingsScreen.tsx       # Text size, appearance, account settings
│   ├── SearchScreen.tsx         # Article search
│   ├── SavedArticlesScreen.tsx  # Saved articles list
│   ├── HistoryScreen.tsx        # Reading history
│   ├── ManipulationAvoidedScreen.tsx # Stats detail: phrases avoided breakdown
│   ├── SourceTransparencyScreen.tsx  # Source info
│   ├── AboutScreen.tsx          # App info
│   └── WhatNtrlIsScreen.tsx     # First-run onboarding manifesto
├── components/       # Reusable components
│   ├── CategoryPills.tsx        # Horizontal scrollable category pills for section navigation
│   ├── CustomTabBar.tsx         # Bottom tab bar with haptics, fixed-height icon containers
│   ├── NtrlContent.tsx          # Inline transparency view (highlights, legend, categories)
│   ├── ManipulationGauge.tsx    # Semi-circular manipulation density gauge (react-native-svg)
│   ├── ArticleBrief.tsx         # Brief article paragraphs (serif)
│   ├── SegmentedControl.tsx     # Brief/Full/Ntrl tab switcher
│   ├── SkeletonCard.tsx         # Loading skeleton placeholders
│   ├── ErrorBoundary.tsx        # Error boundary wrapper
│   └── stats/                   # Reading stats components
│       ├── MyStatsCard.tsx      # Hero stats card for ProfileScreen
│       ├── StatBucket.tsx       # Reusable metric display
│       ├── BarChart.tsx         # Simple bar chart (react-native-svg)
│       ├── CategoryBreakdownList.tsx # Span counts by reason
│       └── RangeSwitcher.tsx    # Time range selector
├── storage/          # Local storage
│   ├── storageService.ts        # AsyncStorage + SecureStore helpers
│   ├── secureStorage.ts         # Expo SecureStore wrapper
│   └── types.ts                 # Storage type definitions (includes stats types)
├── services/         # Business logic
│   ├── detailSummary.ts         # Summary composition helpers
│   └── statsService.ts          # Reading session tracking and stats aggregation
├── navigation/       # Navigation types
│   └── types.ts                 # Type-safe route definitions
├── api.ts            # API client (calls ntrl-api backend)
├── config/           # Environment configuration
├── theme/            # Design system (colors, typography, spacing)
├── types.ts          # TypeScript interfaces
└── utils/            # Helper functions
    └── dateHelpers.ts           # Date utilities for stats (local date, ranges)
```

## Design System
All UI must use values from `src/theme/`:
- **Colors:** Warm off-white background, dark gray text, muted accents
- **Typography:** Defined scale from 11-22px
- **Spacing:** xs(4) sm(8) md(12) lg(16) xl(20) xxl(24) xxxl(32)

Visual target: "A calm sunny morning with blue skies and coffee"

### Dark Mode Support (CRITICAL)
The app supports light/dark mode. All screens MUST use dynamic styles:

```typescript
// CORRECT - supports dark mode
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

export default function MyScreen() {
  const { theme, colorMode } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  // ...
}

function createStyles(theme: Theme) {
  const { colors, spacing, layout } = theme;
  return StyleSheet.create({ /* use colors from theme */ });
}
```

```typescript
// WRONG - will NOT respond to dark mode changes
import { colors, spacing, layout } from '../theme';
const styles = StyleSheet.create({ /* static colors */ });
```

**Key rules:**
1. Never import static `colors`, `spacing`, `layout` from `'../theme'`
2. Always use `useTheme()` hook to get theme dynamically
3. Create styles inside a `createStyles(theme: Theme)` function
4. Use `useMemo(() => createStyles(theme), [theme])` in components
5. Pass `styles` as props to sub-components

## API Integration
Backend: `ntrl-api` (FastAPI/Python)
- `GET /v1/brief` - Daily brief with sections
- `GET /v1/stories/{id}` - Story detail
- `GET /v1/stories/{id}/transparency` - What was neutralized (includes `field` on spans: `title` or `body`)

## Core Principles (MUST FOLLOW)
1. **No engagement** - No likes, saves, shares, comments, ever
2. **No urgency** - No "breaking", "just in", "trending"
3. **Calm UX** - Subtle animations, muted colors, no flashy effects
4. **Transparency** - Always show what was changed/removed
5. **Determinism** - Same content for all users

## Architecture Notes

### Backend vs Frontend Responsibilities

**IMPORTANT:** This app follows strict separation of concerns:

- **Backend (ntrl-api)** handles:
  - Article ingestion from RSS sources
  - Content extraction and storage (S3)
  - Article classification (LLM → 20 domains → 10 feed categories)
  - Neutralization via LLM (4 providers + mock fallback)
  - Transparency span generation
  - Brief assembly (grouped by 10 feed categories)

- **Frontend (ntrl-app)** handles:
  - UI presentation only
  - API data consumption
  - Theme/styling
  - Navigation
  - User topic preferences (client-side filtering of brief sections)

## Feed Categories

10 categories (world, us, local, business, technology, science, health, environment, sports, culture). Client-side filtering via `selectedTopics` preference. Details: `.claude/reference/feed-categories.md`

## First-Run Onboarding

`WhatNtrlIsScreen.tsx` manifesto shown on first launch. Controlled by `hasSeenIntro` preference. Details: `.claude/reference/onboarding.md`

## Search & Filters

Full-text search with trending topics, saved/recent searches, and filter sheet (sort, date, categories, publishers). Details: `.claude/reference/search-filters.md`

## My Stats / Reading Stats

Session tracking (dwell time/scroll depth), `statsService.ts` for aggregation, `components/stats/` for UI. No gamification — calm UX only. Details: `.claude/reference/reading-stats.md`

## Git Workflow

Follow the branch and commit conventions in the root `CLAUDE.md`. Key points for ntrl-app:

- **Branch prefixes**: `feature/`, `fix/`, `docs/`, `refactor/`, `chore/`
- **Conventional commits**: `type: description` format, enforced by `scripts/commit-msg` hook
- **Pre-commit checks**: ESLint + Prettier + TypeScript + secret detection, runs on staged `.ts/.tsx` files via `scripts/pre-commit`
- **CI** (`ci.yml`): ESLint + Prettier + TypeScript + Jest (164 tests) with coverage upload
- **ESLint config notes**: `react/no-unescaped-entities` is off (not relevant for React Native). React Compiler rules (`react-hooks/refs`, `purity`, `immutability`, `set-state-in-effect`) from react-hooks v7 are set to `warn`. `@typescript-eslint/no-explicit-any` is `warn`.

Install hooks after cloning: `npm install` (runs `prepare` script automatically)

## Commands
```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in browser
```

## Claude Skills

Available slash commands for development:

| Skill | Description |
|-------|-------------|
| `/ntrl-ui` | UI component guidance with correct dark mode patterns (`useTheme()`, `createStyles`) |
| `/ntrl-ui-test` | Capture screenshots via Playwright for visual verification |
| `/ntrl-test-screen` | Capture a single screen by name (faster than full suite) |
| `/ntrl-dark-check` | Capture light + dark mode variants for comparison |
| `/ntrl-new-screen` | Scaffold a new screen with correct NTRL patterns + test |
| `/ntrl-new-component` | Scaffold a new component with props, theme, + test |
| `/ntrl-lint-fix` | Run ESLint fix + Prettier format + TypeScript check |
| `/ntrl-typecheck` | Run TypeScript checking filtered to `src/` files |
| `/ntrl-visual-diff` | Compare screenshots against baselines for visual regression |
| `/ntrl-native-test` | Take native iOS Simulator screenshot via Expo MCP |
| `/ntrl-ios-capture` | Capture screenshot from iOS Simulator via Expo |
| `/ntrl-validate-highlights` | Validate manipulation highlights are rendering correctly |

**Usage:** Type the skill name (e.g., `/ntrl-ui`) to invoke.

## The 3-Tab Content Architecture

ArticleDetailScreen has three view modes, all rendered inline (no navigation transitions):

| Tab | Content Source | Description |
|-----|----------------|-------------|
| **Brief** | `detail_brief` | LLM-synthesized summary (serif, via ArticleBrief component) |
| **Full** | `detail_full` | LLM-neutralized full article (serif) |
| **Ntrl** | `original_body` + `spans` | Original text with highlighted manipulation spans (via NtrlContent component) |

**Key insight**: Spans reference positions in `original_body` (for body spans) or `original_title` (for title spans), not `detail_full`. The Ntrl tab shows the original text with category-colored inline highlights. All three tabs swap content in-place with no page transitions.

### Title Span Detection (Jan 2026)

Headlines are now analyzed for manipulation alongside the article body. The transparency API returns spans with a `field` attribute:

| Field | Content | Example Manipulation |
|-------|---------|---------------------|
| `title` | Original headline | "Trump SLAMS critics" |
| `body` | Original article body | "shocking", "slammed" |

**NtrlContent props:**
```typescript
type NtrlContentProps = {
  item: Item;
  fullOriginalText: string | null | undefined;
  originalTitle?: string;                    // Original headline for display
  transformations: Transformation[];         // Body spans
  titleTransformations?: Transformation[];   // Title spans (new)
};
```

**ArticleDetailScreen state:**
- `originalTitleText` - Original headline text
- `bodyTransformations` - Spans where `field === 'body'`
- `titleTransformations` - Spans where `field === 'title'`

### Highlight Colors, Legend & Gauge

Category-colored highlights (rose/blue/lavender/amber/gold), collapsible legend, semi-circular manipulation gauge. Details: `.claude/reference/highlight-details.md`

## UI Self-Testing (CRITICAL for Claude)

**Claude MUST test UI changes visually before asking the user to verify.**

### RECOMMENDED: Use `/ntrl-ui-test` Skill

The simplest way to capture screenshots is the `/ntrl-ui-test` skill, which runs the comprehensive capture script:

```
/ntrl-ui-test
```

This invokes `e2e/capture-all-screens.cjs` which:
- Captures all major screens (Today, Sections, Profile, Settings, Search, Saved, History)
- Navigates to article detail and captures Brief/Full/Ntrl tabs
- **Auto-detects scrollable screens** and captures both `-top.png` and `-bottom.png` variants
- **Non-scrollable screens** (like Settings) get a single `.png` file
- Handles tab switching with retry logic for reliability
- Saves screenshots to `/Users/ericrbrown/Documents/NTRL/Screen Shots/`

### Manual Script Execution

Alternatively, run the script directly:

```bash
cd /Users/ericrbrown/Documents/NTRL/code/ntrl-app
node e2e/capture-all-screens.cjs
```

**Requirements:** Expo web must be running on `localhost:8081` (`npm start -- --web`)

**Output:** 23 screenshots covering all app screens, saved to `/Users/ericrbrown/Documents/NTRL/Screen Shots/`

### Alternative: Playwright Test Suite

```bash
npx playwright test e2e/claude-ui-check.spec.ts
```

Screenshots saved to `e2e/snapshots/`. Note: Some tests may fail if Safari/WebKit not installed.

### Alternative: Expo MCP (Native Simulator)

Use `/ntrl-native-test` for native iOS Simulator screenshots via Expo MCP. More accurate than Playwright for safe area, scroll physics, and touch targets. Requires Expo dev server running + iOS Simulator booted.

### Alternative: iOS Simulator (Manual)

Use `/ntrl-ios-capture` skill for iOS Simulator screenshots.

### Visual Regression Testing

Use `/ntrl-visual-diff` to compare current screenshots against approved baselines:
```bash
cd /Users/ericrbrown/Documents/NTRL/code/ntrl-app
node e2e/capture-all-screens.cjs    # capture current state
node e2e/compare-screenshots.cjs    # compare against baselines
node e2e/update-baselines.cjs       # approve current as new baselines
```

### Maestro E2E Flows (Unstable)

YAML-based native E2E tests in `maestro/flows/`. **Status: NO-GO as of Feb 2026** — Maestro 2.1.0 has persistent XCTest driver timeout issues with iOS 26.2 / Xcode 26. Flows are written but cannot run reliably.

```bash
# These fail with "iOS driver not ready in time" on current setup
maestro test maestro/flows/feed-browse.yaml
maestro test maestro/flows/article-tabs.yaml
```

Re-evaluate when Maestro releases an update with iOS 26 compatibility.

### When to Test

Always test UI after:
1. Backend neutralization changes (affects detail_full, spans)
2. API response format changes
3. Frontend component changes
4. Theme/styling updates

### What to Verify

| Screen | What to Check |
|--------|---------------|
| Intro (first-run) | Manifesto text displays, scrollable, "Begin" button works |
| Feed | Titles are neutralized (no clickbait, urgency) |
| Article Detail (Brief) | `detail_brief` - coherent summary, factual |
| Article Detail (Full) | `detail_full` - readable, not garbled, neutralized |
| Article Detail (Ntrl tab) | `original_body` with category-colored highlights, legend, badge |
| Tab Bar | Labels horizontally aligned, icons centered, consistent across text sizes |

### Tab Bar / Navigation Changes

After modifying tab bar or navigation components, verify:
1. **Horizontal alignment**: All tab labels should sit on the same baseline
2. **Icon consistency**: Icons should be vertically centered within fixed-height containers
3. **Text size scaling**: Test with small/medium/large text size preferences
4. **Active state**: Verify active tab styling doesn't affect alignment

## Console Logging (Debug)

The frontend logs diagnostic info to console (visible in Expo dev tools or browser):
- `[ArticleDetail] Transparency data received:` - spans and originalBody info
- `[ArticleDetail] Detail content:` - brief/full lengths and previews

## Test IDs Available

The following `testID` attributes exist for testing:
- `testID="ntrl-view-screen"` - The ntrl content container (inline in ArticleDetailScreen)
- `testID="ntrl-view-text"` - The article text in ntrl view
- `testID="highlight-span-{index}"` - Individual highlighted spans (0, 1, 2, ...)

**Note:** Feed items do NOT have `testID="article-item"`. Use text-based navigation instead:
```javascript
// Find article by title text
await page.getByText('Article Title', { exact: false }).first().click();
```

## Highlight Validation

Use `/ntrl-validate-highlights` skill to capture the Ntrl tab and verify highlights are rendering correctly.

## Related Files
- **API backend**: `../ntrl-api/`
- **Documentation**: `../ntrl-api/docs/` — all project docs live in ntrl-api repo
- **Design specs**: `../../Screen Mocks/`
- **Brand guidelines**: `../../Brand/`
