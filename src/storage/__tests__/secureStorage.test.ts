/**
 * Tests for secureStorage.
 *
 * Covers: setSecureItem, getSecureItem, deleteSecureItem,
 * isSecureStorageAvailable, setSecureJSON, getSecureJSON,
 * and platform-specific (native vs web) behavior.
 */

// ---------------------------------------------------------------------------
// Mocks — must be declared before imports
// ---------------------------------------------------------------------------

const mockPlatform = { OS: 'ios' as string };

jest.mock('react-native', () => ({
  Platform: mockPlatform,
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import * as SecureStore from 'expo-secure-store';
import {
  setSecureItem,
  getSecureItem,
  deleteSecureItem,
  isSecureStorageAvailable,
  setSecureJSON,
  getSecureJSON,
} from '../secureStorage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulated localStorage for web tests. */
function createMockLocalStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
    }),
    key: jest.fn((_index: number) => null),
    get length() {
      return Object.keys(store).length;
    },
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  mockPlatform.OS = 'ios'; // Default to native
});

// ===========================================================================
// Native platform (iOS / Android)
// ===========================================================================

describe('Native platform (iOS/Android)', () => {
  describe('setSecureItem', () => {
    it('stores a value via SecureStore.setItemAsync', async () => {
      await setSecureItem('token', 'abc123');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', 'abc123');
    });

    it('throws when SecureStore fails', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Keychain error')
      );

      await expect(setSecureItem('key', 'value')).rejects.toThrow('Keychain error');
    });
  });

  describe('getSecureItem', () => {
    it('retrieves a value from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('stored-value');

      const result = await getSecureItem('key');
      expect(result).toBe('stored-value');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('key');
    });

    it('returns null when key does not exist', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      const result = await getSecureItem('missing');
      expect(result).toBeNull();
    });

    it('returns null on SecureStore error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(
        new Error('read error')
      );

      const result = await getSecureItem('key');
      expect(result).toBeNull();
    });
  });

  describe('deleteSecureItem', () => {
    it('deletes a value from SecureStore', async () => {
      await deleteSecureItem('key');

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key');
    });

    it('does not throw on delete error', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(
        new Error('delete error')
      );

      // Should not throw
      await expect(deleteSecureItem('key')).resolves.toBeUndefined();
    });
  });

  describe('isSecureStorageAvailable', () => {
    it('returns true when SecureStore works correctly', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test');
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await isSecureStorageAvailable();
      expect(result).toBe(true);
    });

    it('returns false when SecureStore fails', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
        new Error('not available')
      );

      const result = await isSecureStorageAvailable();
      expect(result).toBe(false);
    });

    it('returns false when read-back does not match written value', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('wrong-value');
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await isSecureStorageAvailable();
      expect(result).toBe(false);
    });
  });
});

// ===========================================================================
// Web platform (localStorage fallback)
// ===========================================================================

describe('Web platform (localStorage fallback)', () => {
  let mockLocalStorage: Storage;

  beforeEach(() => {
    mockPlatform.OS = 'web';
    mockLocalStorage = createMockLocalStorage();
    // Need to re-import to pick up platform change — since Platform.OS is
    // read at module level via `const isWeb = Platform.OS === 'web'`,
    // we use the mutable mockPlatform object. However the module caches
    // `isWeb` at import time, so we need to reset the module cache.
  });

  /**
   * Because secureStorage caches `const isWeb = Platform.OS === 'web'` at
   * module load time, changing Platform.OS after import has no effect on
   * the cached module. To properly test web behavior we would need
   * jest.isolateModules or jest.resetModules.
   *
   * These tests use jest.isolateModules to get a fresh module with web
   * platform detection.
   */
  function getWebModule(): typeof import('../secureStorage') {
    let mod!: typeof import('../secureStorage');
    jest.isolateModules(() => {
      mockPlatform.OS = 'web';
      // Set up global localStorage before importing
      Object.defineProperty(global, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
        configurable: true,
      });
      mod = require('../secureStorage');
    });
    return mod;
  }

  afterEach(() => {
    // Clean up global localStorage
    if ('localStorage' in global) {
      delete (global as Record<string, unknown>).localStorage;
    }
  });

  it('setSecureItem stores to localStorage with prefix', async () => {
    const webModule = getWebModule();
    await webModule.setSecureItem('key', 'value');

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      '@ntrl/secure/key',
      'value'
    );
  });

  it('getSecureItem reads from localStorage with prefix', async () => {
    const webModule = getWebModule();
    (mockLocalStorage.getItem as jest.Mock).mockReturnValue('web-value');

    const result = await webModule.getSecureItem('key');

    expect(result).toBe('web-value');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('@ntrl/secure/key');
  });

  it('deleteSecureItem removes from localStorage with prefix', async () => {
    const webModule = getWebModule();
    await webModule.deleteSecureItem('key');

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('@ntrl/secure/key');
  });

  it('isSecureStorageAvailable returns true when localStorage exists', async () => {
    const webModule = getWebModule();
    const result = await webModule.isSecureStorageAvailable();
    expect(result).toBe(true);
  });

  it('does not call SecureStore APIs on web', async () => {
    const webModule = getWebModule();
    await webModule.setSecureItem('key', 'val');
    await webModule.getSecureItem('key');
    await webModule.deleteSecureItem('key');

    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// JSON helpers
// ===========================================================================

describe('setSecureJSON / getSecureJSON', () => {
  it('serializes and stores JSON objects', async () => {
    await setSecureJSON('prefs', { topics: ['world'], textSize: 'large' });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'prefs',
      JSON.stringify({ topics: ['world'], textSize: 'large' })
    );
  });

  it('retrieves and parses JSON objects', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ topics: ['us'], textSize: 'small' })
    );

    const result = await getSecureJSON<{ topics: string[]; textSize: string }>('prefs');

    expect(result).toEqual({ topics: ['us'], textSize: 'small' });
  });

  it('returns null when key does not exist', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

    const result = await getSecureJSON('missing');
    expect(result).toBeNull();
  });

  it('returns null for invalid JSON', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('not-valid-json');

    const result = await getSecureJSON('bad');
    expect(result).toBeNull();
  });

  it('warns when value exceeds 2048 byte limit', async () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    const largeObj = { data: 'x'.repeat(2100) };

    await setSecureJSON('big', largeObj);

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('exceeds 2048 byte limit')
    );
    // Should still attempt to store
    expect(SecureStore.setItemAsync).toHaveBeenCalled();

    spy.mockRestore();
  });
});
