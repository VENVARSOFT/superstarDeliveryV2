import {MMKV} from 'react-native-mmkv';

type KeyValueStore = {
  set: (key: string, value: string) => void;
  getString: (key: string) => string | undefined;
  delete: (key: string) => void;
};

const createSafeStore = (options: {
  id: string;
  encryptionKey?: string;
}): KeyValueStore => {
  try {
    // MMKV needs JSI. When remote debugging is enabled, JSI is unavailable.
    // Guard here to avoid crashing in debug sessions.
    // @ts-ignore - React Native global injected by runtime
    const hasJSI = typeof global.nativeCallSyncHook !== 'undefined';
    if (!hasJSI) {
      throw new Error('JSI not available');
    }
    return new MMKV(options) as unknown as KeyValueStore;
  } catch (error) {
    // Fallback to an in-memory store so app can still run while debugging.
    const memory = new Map<string, string>();
     
    console.warn(
      '[storage] MMKV unavailable, using in-memory fallback:',
      (error as Error)?.message,
    );
    return {
      set: (key: string, value: string) => memory.set(key, value),
      getString: (key: string) => memory.get(key),
      delete: (key: string) => {
        memory.delete(key);
      },
    };
  }
};

export const tokenStorage: KeyValueStore = createSafeStore({
  id: 'token-storage',
  encryptionKey: 'some_secret_key',
});

export const storage: KeyValueStore = createSafeStore({
  id: 'my-app-storage',
  encryptionKey: 'some_secret_key',
});

export const mmkvStorage = {
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  getItem: (key: string) => {
    const value = storage.getString(key);
    return value ?? null;
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
};
