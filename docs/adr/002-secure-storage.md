# ADR 002: Secure Storage Approach

## Status
Accepted

## Context

The NTRL app stores various user data locally:
- User preferences (section visibility, notification settings)
- Saved articles
- Reading history
- Cached API responses
- Recent search terms

We needed to determine:
1. Which storage mechanism to use
2. What data requires encryption
3. How to handle storage limits and failures

## Decision

We implemented a **two-tier storage approach**:

### Tier 1: AsyncStorage (Non-Sensitive Data)

Used for data that does not require encryption:
- Saved articles
- Reading history
- Cached briefs
- Recent searches

```typescript
// storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getSavedArticles(): Promise<SavedArticle[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_ARTICLES);
  return json ? JSON.parse(json) : [];
}
```

### Tier 2: SecureStore (Sensitive Data)

Used for data requiring encryption:
- User preferences
- Future: Authentication tokens

```typescript
// secureStorage.ts
import * as SecureStore from 'expo-secure-store';

export async function getPreferences(): Promise<UserPreferences | null> {
  const json = await SecureStore.getItemAsync(STORAGE_KEYS.PREFERENCES);
  return json ? JSON.parse(json) : null;
}
```

### Storage Key Constants

All storage keys centralized in `src/constants/index.ts`:

```typescript
export const STORAGE_KEYS = {
  PREFERENCES: 'ntrl_preferences',       // SecureStore
  SAVED_ARTICLES: 'ntrl_saved_articles', // AsyncStorage
  HISTORY: 'ntrl_history',               // AsyncStorage
  RECENT_SEARCHES: 'ntrl_recent_searches', // AsyncStorage
  BRIEF_CACHE: 'ntrl_brief_cache',       // AsyncStorage
} as const;
```

### Storage Limits

| Key | Limit | Behavior at Limit |
|-----|-------|-------------------|
| Saved Articles | 100 | Remove oldest |
| History | 50 | Remove oldest |
| Recent Searches | 10 | Remove oldest |
| Brief Cache | 1 (latest) | Replace |

## Consequences

### Positive

- **Security**: Sensitive preferences encrypted at rest
- **Performance**: Non-sensitive data uses faster AsyncStorage
- **Platform support**: Both work on iOS, Android, and Web
- **Expo managed**: No native linking required

### Negative

- **SecureStore limits**: 2KB value limit on iOS (preferences fit easily)
- **No query capability**: Must load and filter in memory
- **Web fallback**: SecureStore uses localStorage on web (less secure)

### Mitigations

- Keep preference objects small and structured
- Consider SQLite if query needs grow (future)
- Document web security limitations

## Alternatives Considered

### 1. AsyncStorage Only
- **Rejected**: Preferences could be read by other apps or extracted
- **Concern**: Privacy expectations from users

### 2. SQLite / WatermelonDB
- **Rejected**: Overkill for current needs
- **Concern**: Adds complexity, migration requirements
- **Future**: Could add if search/query needs grow

### 3. MMKV
- **Rejected**: Not Expo-managed, requires native module
- **Concern**: Breaks Expo managed workflow

### 4. Encrypt AsyncStorage Values
- **Rejected**: Would need to manage encryption keys
- **Concern**: SecureStore already provides this

## Security Considerations

### What SecureStore Provides
- **iOS**: Keychain Services (hardware-backed on modern devices)
- **Android**: EncryptedSharedPreferences with Keystore
- **Web**: localStorage (NOT secure, documented limitation)

### What We Store in SecureStore
- Theme preference (light/dark/system)
- Section visibility preferences
- Notification settings
- Future: Auth tokens, refresh tokens

### What We DO NOT Store
- Article content (public data)
- Cached API responses (public data)
- Search history (not sensitive enough)

## Implementation Notes

### Error Handling

```typescript
// Always handle SecureStore failures gracefully
try {
  const prefs = await SecureStore.getItemAsync(key);
  return prefs ? JSON.parse(prefs) : DEFAULT_PREFERENCES;
} catch (error) {
  logger.warn('SecureStore read failed, using defaults');
  return DEFAULT_PREFERENCES;
}
```

### Migration

If storage schema changes:
1. Check for version key
2. Migrate data structure
3. Update version key

## References

- expo-secure-store: https://docs.expo.dev/versions/latest/sdk/securestore/
- iOS Keychain Services: https://developer.apple.com/documentation/security/keychain_services
- Android EncryptedSharedPreferences: https://developer.android.com/reference/androidx/security/crypto/EncryptedSharedPreferences
