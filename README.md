# NTRL App

React Native mobile application for NTRL - Neutral News.

## Tech Stack

- **Framework**: React Native 0.81.5 with Expo 54
- **Language**: TypeScript 5.9
- **Navigation**: React Navigation (Native Stack)
- **Platforms**: iOS, Android, Web
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier

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

## Environment Configuration

The app supports three environments configured via `app.json`:

| Environment | API URL | Command |
|-------------|---------|---------|
| Development | `http://localhost:8000` | `npm start` |
| Staging | `api-staging-*.railway.app` | `EXPO_PUBLIC_ENV=staging npm start` |
| Production | `api.ntrl.app` | `EXPO_PUBLIC_ENV=production npm start` |

Configuration is handled in `src/config/index.ts`:

```typescript
import { API_BASE_URL, ENABLE_DEV_MODE } from './config';
```

## Testing

### Run All Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### Test Structure

```
src/
├── services/__tests__/
│   └── redline.test.ts    # Redline detection tests
├── utils/__tests__/
│   ├── text.test.ts       # Text utility tests
│   └── urlValidator.test.ts
```

## Code Quality

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Formatting

```bash
npm run format
```

### Type Checking

TypeScript is configured with strict mode. The compiler runs automatically during builds.

## Project Structure

```
ntrl-app/
├── src/
│   ├── api.ts             # Backend API client
│   ├── types.ts           # Core TypeScript interfaces
│   ├── config/            # Environment configuration
│   ├── constants/         # Centralized constants
│   ├── components/        # Reusable UI components
│   ├── screens/           # App screens
│   ├── services/          # Business logic
│   ├── storage/           # Data persistence
│   ├── theme/             # Design system
│   ├── navigation/        # Navigation types
│   ├── utils/             # Helper utilities
│   └── dev/               # Development utilities
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md    # System architecture
│   ├── DATA_FLOW.md       # Data flow diagrams
│   └── adr/               # Architecture decisions
├── assets/                # Static assets
├── App.js                 # Root component
└── package.json
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## Screens

| Screen | Purpose |
|--------|---------|
| FeedScreen | Main daily brief with sections |
| ArticleDetailScreen | Full article view |
| NtrlViewScreen | Clean reader mode |
| RedlineScreen | Transparency view |
| ProfileScreen | Settings & preferences |
| SearchScreen | Article search |
| SavedArticlesScreen | Saved items |
| HistoryScreen | Reading history |
| AboutScreen | App information |

## Theme Customization

The app uses a context-based theme system supporting light and dark modes.

### Using the Theme

```typescript
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

function MyComponent() {
  const { theme, colorMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <View style={styles.container}>...</View>;
}

function createStyles(theme: Theme) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      padding: spacing.md,
    },
  });
}
```

### Theme Structure

- `colors` - Color palette (light/dark variants)
- `typography` - Font sizes and weights
- `spacing` - Spacing scale (xs, sm, md, lg, xl, xxl, xxxl)
- `layout` - Common layout values

See [docs/adr/001-theme-system.md](docs/adr/001-theme-system.md) for design decisions.

## API Integration

The app connects to the NTRL backend API:

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/brief` | Daily brief with sections |
| `GET /v1/stories/{id}` | Story detail |
| `GET /v1/stories/{id}/transparency` | Removed phrases |

Features:
- Automatic retry with exponential backoff
- Request timeout (10s)
- Offline cache fallback

## Troubleshooting

### Common Issues

#### Metro bundler won't start

```bash
# Clear Metro cache
npx expo start --clear
```

#### iOS build fails

```bash
# Clean iOS build
cd ios && pod install --repo-update && cd ..
npx expo run:ios
```

#### Android build fails

```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
npx expo run:android
```

#### Tests failing

```bash
# Clear Jest cache
npm test -- --clearCache
```

#### Type errors after dependency update

```bash
# Regenerate types
rm -rf node_modules
npm install
npx tsc --noEmit
```

### Environment Issues

#### API connection fails

1. Check `src/config/index.ts` for correct environment
2. Verify backend is running (for local dev)
3. Check network connectivity

#### Dark mode not working

1. Ensure using `useTheme()` hook, not static imports
2. Check component uses `createStyles(theme)` pattern
3. Verify `useMemo` depends on `theme`

#### Storage not persisting

1. Check AsyncStorage permissions
2. Verify storage keys in `src/constants/index.ts`
3. Check for SecureStore errors in logs

### Debug Mode

Enable verbose logging:

```typescript
// In src/utils/logger.ts - temporarily set:
const ENABLE_LOGGING = true;
```

## Building for Production

### Development Build

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### Production Build (EAS)

```bash
# Configure EAS (first time)
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both
eas build --platform all
```

## Design Principles

NTRL follows strict design principles:

1. **Calm UX** - No urgency, no "breaking" alerts
2. **No engagement** - No likes, saves, shares, comments
3. **Transparency** - Always show what was changed
4. **Determinism** - Same content for all users
5. **No manipulation** - Strip sensational language

## Contributing

### Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/my-feature`

### Development Workflow

1. Make changes
2. Run tests: `npm test`
3. Run linting: `npm run lint`
4. Commit with descriptive message
5. Push and create PR

### Code Standards

- Follow existing code patterns
- Use TypeScript strict mode
- Add tests for new functionality
- Use the theme system for all UI
- Document public APIs with JSDoc

### Commit Messages

Use conventional commits:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `test: add tests`
- `refactor: restructure code`

## Related Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Data Flow](docs/DATA_FLOW.md)
- [Theme System ADR](docs/adr/001-theme-system.md)
- [Secure Storage ADR](docs/adr/002-secure-storage.md)
- [API Documentation](../ntrl-api/README.md)
