# First-Run Onboarding

New users see a manifesto screen (`WhatNtrlIsScreen.tsx`) on first app launch, explaining NTRL's mission before entering the main app.

## Flow

1. `App.js` checks `hasSeenIntro` preference via `hasSeenIntro()` helper
2. If false/undefined, renders `WhatNtrlIsScreen` instead of main navigation
3. User reads manifesto and taps "Begin"
4. `markIntroSeen()` sets `hasSeenIntro: true` in preferences
5. App transitions to main feed

## Storage

- Preference key: `hasSeenIntro` (boolean) in `UserPreferences`
- Helpers in `storageService.ts`: `hasSeenIntro()`, `markIntroSeen()`

## Testing the Intro Screen

```javascript
// Reset to show intro again (run in browser console or via Playwright)
localStorage.clear();
location.reload();
```

## Design

- Georgia serif font for manifesto text
- Scrollable content area
- Fixed "Begin" button at bottom
- Supports light/dark mode
- Fade-in animation on mount
