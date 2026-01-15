# NTRL App - Project Context

## What is NTRL?
A "neutral news" app that strips manipulative language from news articles and presents them in a calm, deterministic feed. No engagement metrics, no personalization, no urgency.

## Tech Stack
- **Framework:** React Native 0.81.5 with Expo 54
- **Language:** TypeScript 5.9
- **Navigation:** React Navigation (Native Stack)
- **Platforms:** iOS, Android (mobile-only)

## Project Structure
```
src/
├── screens/          # App screens
│   ├── FeedScreen.tsx           # Main daily brief
│   ├── ArticleDetailScreen.tsx  # Full article view
│   ├── NtrlViewScreen.tsx       # Transparency view
│   └── AboutScreen.tsx          # App info
├── services/         # Business logic
│   └── detailSummary.ts         # Summary composition helpers
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
- `GET /v1/stories/{id}/transparency` - What was neutralized

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
  - Neutralization via LLM (4 providers + mock fallback)
  - Transparency span generation
  - Brief assembly

- **Frontend (ntrl-app)** handles:
  - UI presentation only
  - API data consumption
  - Theme/styling
  - Navigation

## Commands
```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in browser
```

## Related Files
- API backend: `../ntrl-api/`
- Design specs: `../../Screen Mocks/`
- Brand guidelines: `../../Brand/`
