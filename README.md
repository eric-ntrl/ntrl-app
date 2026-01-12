# NTRL App

React Native mobile application for NTRL - Neutral News.

## Tech Stack

- **Framework**: React Native 0.81.5 with Expo 54
- **Language**: TypeScript 5.9
- **Navigation**: React Navigation (Native Stack)
- **Platforms**: iOS, Android, Web

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
npm install
```

### Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### API Configuration

The app connects to the backend API. Configure the endpoint in `src/config.ts`:

```typescript
export const API_BASE_URL = 'https://api-staging-7b4d.up.railway.app';
```

## Project Structure

```
ntrl-app/
├── src/
│   ├── screens/           # App screens
│   │   ├── FeedScreen.tsx         # Main daily brief feed
│   │   ├── ArticleDetailScreen.tsx # Full article view
│   │   ├── RedlineScreen.tsx      # Transparency view
│   │   └── AboutScreen.tsx        # App information
│   ├── services/          # Business logic
│   │   ├── readerMode.ts          # Article extraction
│   │   ├── redline.ts             # Manipulative language detection
│   │   └── detailSummary.ts       # Summary composition
│   ├── api.ts             # API client
│   ├── types.ts           # TypeScript definitions
│   ├── theme.ts           # Design system (colors, typography)
│   └── config.ts          # Configuration
├── assets/                # App icons and images
├── App.js                 # Root component
├── app.json               # Expo configuration
└── package.json           # Dependencies
```

## Screens

### Feed Screen
Main screen showing the daily brief with sections:
- World
- U.S.
- Local
- Business
- Technology

### Article Detail Screen
Full article view with:
- Neutralized headline and summary
- Reader mode for clean text
- Link to transparency view
- Link to original source

### Redline Screen
Transparency view showing:
- Original article text
- Highlighted manipulative language
- Categories of removed content

### About Screen
App information and mission statement.

## Design Principles

Following NTRL's core principles:
- **Calm UX**: No urgency language, no "breaking" alerts
- **No engagement**: No likes, saves, shares
- **Transparency**: Always show what was changed
- **Determinism**: Same content for all users

## API Integration

The app fetches data from the NTRL API:

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/brief` | Daily brief with sections |
| `GET /v1/stories/{id}` | Story detail |
| `GET /v1/stories/{id}/transparency` | What was removed |

See [API Documentation](../ntrl-api/README.md) for full details.

## Building

### Development Build
```bash
expo build:ios
expo build:android
```

### Production Build
```bash
eas build --platform ios
eas build --platform android
```

## Related Documentation

- [API Reference](../ntrl-api/README.md)
- [UX Language Rules](../../Brand/NTRL_UX_Language_Rules_v1.0.pdf)
- [Wireframe Spec](../../Screen%20Mocks/NTRL_Phase-1_Wireframe_Spec_v1.1.pdf)
