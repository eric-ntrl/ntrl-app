import * as SecureStore from 'expo-secure-store';

/**
 * Secure storage wrapper using expo-secure-store.
 * Uses platform-specific secure storage (Keychain on iOS, EncryptedSharedPreferences on Android).
 *
 * Note: SecureStore has a 2048 byte limit per item.
 * Use for small, sensitive data like preferences and tokens.
 * Use AsyncStorage for larger data like article lists and cache.
 */

/**
 * Store a value securely.
 * @param key - The key to store the value under
 * @param value - The string value to store (max 2048 bytes)
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    // SecureStore may not be available on all platforms (e.g., web)
    console.warn('[SecureStorage] Failed to set item:', key, error);
    throw error;
  }
}

/**
 * Retrieve a value from secure storage.
 * @param key - The key to retrieve
 * @returns The stored value, or null if not found
 */
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn('[SecureStorage] Failed to get item:', key, error);
    return null;
  }
}

/**
 * Delete a value from secure storage.
 * @param key - The key to delete
 */
export async function deleteSecureItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn('[SecureStorage] Failed to delete item:', key, error);
  }
}

/**
 * Check if secure storage is available on the current platform.
 * SecureStore is not available on web.
 */
export async function isSecureStorageAvailable(): Promise<boolean> {
  try {
    // Try a test write/read/delete cycle
    const testKey = '__secure_storage_test__';
    const testValue = 'test';
    await SecureStore.setItemAsync(testKey, testValue);
    const result = await SecureStore.getItemAsync(testKey);
    await SecureStore.deleteItemAsync(testKey);
    return result === testValue;
  } catch {
    return false;
  }
}

/**
 * Store a JSON object securely.
 * @param key - The key to store the value under
 * @param value - The object to store (will be JSON stringified)
 */
export async function setSecureJSON<T>(key: string, value: T): Promise<void> {
  const json = JSON.stringify(value);
  if (json.length > 2048) {
    console.warn('[SecureStorage] Value exceeds 2048 byte limit, storing may fail');
  }
  await setSecureItem(key, json);
}

/**
 * Retrieve a JSON object from secure storage.
 * @param key - The key to retrieve
 * @returns The parsed object, or null if not found or invalid
 */
export async function getSecureJSON<T>(key: string): Promise<T | null> {
  const json = await getSecureItem(key);
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    console.warn('[SecureStorage] Failed to parse JSON for key:', key);
    return null;
  }
}
