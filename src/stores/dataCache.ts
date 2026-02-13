/**
 * Zustand store for caching GTFS data in localStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

interface DataCacheState {
  cache: Record<string, CacheEntry>;
  version: string | null;
  
  // Actions
  setEntry: (key: string, data: unknown) => void;
  getEntry: <T>(key: string) => T | undefined;
  clearCache: () => void;
  setVersion: (version: string) => void;
  getCacheStats: () => { entryCount: number; sizeBytes: number };
}

// Custom storage that handles quota exceeded errors gracefully
const createSafeLocalStorage = () => {
  return {
    getItem: (name: string) => {
      try {
        return localStorage.getItem(name);
      } catch (e) {
        console.warn('Failed to read from localStorage:', e);
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        localStorage.setItem(name, value);
      } catch (e) {
        if (e instanceof Error && e.name === 'QuotaExceededError') {
          // Storage quota exceeded - try to make room by clearing old cache
          console.warn('Storage quota exceeded, clearing cache to make room');
          try {
            localStorage.removeItem(name);
            // Try again with fresh start
            localStorage.setItem(name, value);
          } catch (e2) {
            // Still failed - give up and continue without caching
            console.warn('Failed to cache data even after clearing:', e2);
          }
        } else {
          console.warn('Failed to write to localStorage:', e);
        }
      }
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name);
      } catch (e) {
        console.warn('Failed to remove from localStorage:', e);
      }
    },
  };
};

export const useDataCacheStore = create<DataCacheState>()(
  persist(
    (set, get) => ({
      cache: {},
      version: null,

      setEntry: (key: string, data: unknown) => {
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: {
              data,
              timestamp: Date.now(),
            },
          },
        }));
      },

      getEntry: <T,>(key: string): T | undefined => {
        const entry = get().cache[key];
        return entry?.data as T | undefined;
      },

      clearCache: () => {
        set({ cache: {} });
      },

      setVersion: (version: string) => {
        set({ version });
      },

      getCacheStats: () => {
        const state = get();
        const entryCount = Object.keys(state.cache).length;
        
        // Estimate size by measuring serialized state
        let sizeBytes = 0;
        try {
          const serialized = JSON.stringify(state.cache);
          sizeBytes = new Blob([serialized]).size;
        } catch (e) {
          // If serialization fails, return 0
          sizeBytes = 0;
        }
        
        return { entryCount, sizeBytes };
      },
    }),
    {
      name: 'gtfs-data-cache',
      storage: createJSONStorage(() => createSafeLocalStorage()),
    }
  )
);

/**
 * Helper function to fetch data with caching
 */
export async function cachedFetch<T>(
  url: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const store = useDataCacheStore.getState();
  
  // Check cache first
  const cached = store.getEntry<T>(url);
  if (cached !== undefined) {
    return cached;
  }
  
  // Cache miss - fetch from network
  const data = await fetcher();
  
  // Store in cache (errors are handled by the custom storage)
  store.setEntry(url, data);
  
  return data;
}

/**
 * Check and update cache version from manifest
 */
export async function checkCacheVersion(): Promise<void> {
  try {
    const response = await fetch('/data/manifest.json');
    if (!response.ok) {
      console.warn('Failed to fetch manifest.json');
      return;
    }
    
    const manifest = await response.json();
    const newVersion = manifest.version;
    
    const store = useDataCacheStore.getState();
    const currentVersion = store.version;
    
    if (currentVersion && currentVersion !== newVersion) {
      // Version changed - clear cache
      console.log(`Cache version mismatch (${currentVersion} -> ${newVersion}), clearing cache`);
      store.clearCache();
    }
    
    // Update to new version
    store.setVersion(newVersion);
  } catch (error) {
    console.warn('Failed to check cache version:', error);
  }
}
