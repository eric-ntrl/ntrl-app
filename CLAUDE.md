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
│   ├── SourceTransparencyScreen.tsx  # Source info
│   └── AboutScreen.tsx          # App info
├── components/       # Reusable components
│   ├── NtrlContent.tsx          # Inline transparency view (highlights, legend, categories)
│   ├── ManipulationGauge.tsx    # Semi-circular manipulation density gauge (react-native-svg)
│   ├── ArticleBrief.tsx         # Brief article paragraphs (serif)
│   ├── SegmentedControl.tsx     # Brief/Full/Ntrl tab switcher
│   ├── SkeletonCard.tsx         # Loading skeleton placeholders
│   └── ErrorBoundary.tsx        # Error boundary wrapper
├── storage/          # Local storage
│   ├── storageService.ts        # AsyncStorage + SecureStore helpers
│   ├── secureStorage.ts         # Expo SecureStore wrapper
│   └── types.ts                 # Storage type definitions
├── services/         # Business logic
│   └── detailSummary.ts         # Summary composition helpers
├── navigation/       # Navigation types
│   └── types.ts                 # Type-safe route definitions
├── api.ts            # API client (calls ntrl-api backend)
├── config/           # Environment configuration
├── theme/            # Design system (colors, typography, spacing)
├── types.ts          # TypeScript interfaces
└── utils/            # Helper functions
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

## Feed Categories & Topic Selection (Jan 2026)

### 10 Feed Categories

The brief is organized into 10 user-facing categories (classified by LLM on the backend):

| Key | Display Name |
|-----|-------------|
| `world` | World |
| `us` | U.S. |
| `local` | Local |
| `business` | Business |
| `technology` | Technology |
| `science` | Science |
| `health` | Health |
| `environment` | Environment |
| `sports` | Sports |
| `culture` | Culture |

### User Topic Selection

Users can toggle categories on/off in ProfileScreen. Filtering is **client-side** — the API always returns all categories, and `SectionsScreen`/`TodayScreen` filter `brief.sections` by the user's `selectedTopics` preference.

**How it works:**
1. ProfileScreen saves topic preferences to SecureStore via `updatePreferences()`
2. SectionsScreen/TodayScreen loads preferences via `useFocusEffect` → `getPreferences()`
3. `filteredBrief` memo filters `brief.sections` by `selectedTopics`
4. All 10 topics are enabled by default for new users

**Preference migration:** Existing users who had the old 5-topic format (`tech` key) are auto-migrated: `tech` → `technology`, and 5 new categories are auto-enabled. See `migrateTopics()` in `storageService.ts`.

**Important:** `migrateTopics()` only runs when the `tech` key is detected (actual old-format data). It does NOT re-add topics on every `getPreferences()` call — this was a bug that was fixed. If you modify migration logic, ensure it doesn't override user deselections.

## Commands
```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in browser
```

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

### Manipulation Gauge (Jan 2026)

The ntrl-view displays a semi-circular gauge showing manipulation density:

```
        ╭─────────────────╮
       ╱   🟢  🟡  🔴      ╲
      │        ↑            │
      ╰─────────────────────╯
         12% manipulation
      15 phrases in 125 words
```

**Component:** `ManipulationGauge.tsx`
- Uses `react-native-svg` for smooth arc rendering
- Gradient: green (0%) → yellow (25%) → red (50%+)
- Props: `percent`, `spanCount`, `wordCount`
- Labels: Minimal (<5%), Low (<15%), Moderate (<30%), High (30%+)
- Capped at 50% visually (anything above is "heavy manipulation")

**Calculation:**
```typescript
const manipulationPercent = (allTransformations.length / wordCount) * 100;
```

### Category-Specific Highlight Colors (Jan 2026)

ntrl-view uses different highlight colors based on manipulation type:

| Reason | Color | Light Mode | Dark Mode |
|--------|-------|------------|-----------|
| `urgency_inflation` | Dusty rose | `rgba(200, 120, 120, 0.35)` | `rgba(200, 120, 120, 0.30)` |
| `emotional_trigger` | Slate blue | `rgba(130, 160, 200, 0.35)` | `rgba(130, 160, 200, 0.30)` |
| `editorial_voice`, `agenda_signaling` | Lavender | `rgba(160, 130, 180, 0.35)` | `rgba(160, 130, 180, 0.30)` |
| `clickbait`, `selling` | Amber/tan | `rgba(200, 160, 100, 0.35)` | `rgba(200, 160, 100, 0.30)` |
| Default (rhetorical_framing, etc.) | Gold | `rgba(255, 200, 50, 0.50)` | `rgba(255, 200, 50, 0.40)` |

Colors are muted to maintain "calm reading" aesthetic. All have similar saturation for visual harmony.

**SpanReason type** (`navigation/types.ts`):
```typescript
type SpanReason = 'clickbait' | 'urgency_inflation' | 'emotional_trigger'
  | 'selling' | 'agenda_signaling' | 'rhetorical_framing' | 'editorial_voice';
```

### Highlight Legend (Jan 2026)

The Ntrl tab includes a collapsible legend explaining what each highlight color means:
- Collapsed by default ("What do colors mean?")
- Shows 4 color swatches with human-readable labels: Emotional language, Urgency/hype, Editorial opinion, Clickbait/selling
- Highlights are always ON (no toggle)
- Component: `HighlightLegend` in `NtrlContent.tsx`

The badge ("N phrases flagged") is always visible when changes exist.

## UI Self-Testing (CRITICAL for Claude)

**Claude MUST test UI changes visually before asking the user to verify.**

### RECOMMENDED: Playwright Custom Script (Most Reliable)

This method captures all views reliably and can navigate through the app:

```bash
cd /Users/ericrbrown/Documents/NTRL/code/ntrl-app

# Start Expo if not running
npm start -- --web &
sleep 5

# Create capture script
cat > capture-screens.cjs << 'EOF'
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.goto('http://localhost:8081');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/tmp/web-feed.png' });
  console.log('Feed captured');

  try {
    // Click first article (adjust text to match)
    await page.click('text=<first-article-title>');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/web-brief.png' });
    console.log('Brief captured');

    await page.click('text=Full');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/web-full.png' });
    console.log('Full captured');

    await page.click('text=Ntrl');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/web-ntrl.png' });
    console.log('Ntrl tab captured');
  } catch (e) {
    console.log('Error:', e.message);
    await page.screenshot({ path: '/tmp/web-error.png' });
  }
  await browser.close();
})();
EOF

# Run it
node capture-screens.cjs

# Clean up
rm capture-screens.cjs
```

Then use the Read tool on `/tmp/web-feed.png`, `/tmp/web-brief.png`, `/tmp/web-full.png`, `/tmp/web-ntrl.png` to view.

### Alternative: Playwright Test Suite

```bash
npx playwright test e2e/claude-ui-check.spec.ts
```

Screenshots saved to `e2e/snapshots/`. Note: Some tests may fail if Safari/WebKit not installed.

### Alternative: iOS Simulator (Manual)

```bash
# Boot simulator
xcrun simctl boot "iPhone 17 Pro"
open -a Simulator

# Open app via Expo
xcrun simctl openurl booted "exp://127.0.0.1:8081"
sleep 10

# Capture screenshot
xcrun simctl io booted screenshot /tmp/sim-screenshot.png
```

**Note**: Maestro often has driver timeout issues. Playwright custom scripts are more reliable.

### When to Test

Always test UI after:
1. Backend neutralization changes (affects detail_full, spans)
2. API response format changes
3. Frontend component changes
4. Theme/styling updates

### What to Verify

| Screen | What to Check |
|--------|---------------|
| Feed | Titles are neutralized (no clickbait, urgency) |
| Article Detail (Brief) | `detail_brief` - coherent summary, factual |
| Article Detail (Full) | `detail_full` - readable, not garbled, neutralized |
| Article Detail (Ntrl tab) | `original_body` with category-colored highlights, legend, badge |

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

## Highlight Validation Script

Quick script to capture ntrl tab and verify highlights:

```javascript
// capture-highlights.cjs
const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(4000);

  // Navigate to article by text
  await page.getByText('Harry Styles', { exact: false }).first().click();
  await page.waitForTimeout(2000);

  // Switch to Ntrl tab (inline in ArticleDetailScreen)
  await page.getByText('Ntrl').click();
  await page.waitForTimeout(3000);

  // Capture screenshot
  await page.screenshot({ path: '/tmp/ntrl-view.png' });

  // Count and log highlights
  const highlights = page.locator('[data-testid^="highlight-span-"]');
  const count = await highlights.count();
  console.log(`Highlights found: ${count}`);

  for (let i = 0; i < count; i++) {
    const text = await highlights.nth(i).textContent();
    console.log(`  ${i}: "${text}"`);
  }

  await browser.close();
})();
```

Run with: `node capture-highlights.cjs`

## Related Files
- **API backend**: `../ntrl-api/`
- **Documentation**: `../ntrl-api/docs/` — all project docs live in ntrl-api repo
- **Design specs**: `../../Screen Mocks/`
- **Brand guidelines**: `../../Brand/`
