import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/**
 * Central QueryClient — shared across the entire app.
 *
 * staleTime  — how long cached data is considered fresh (no background refetch)
 * gcTime     — how long unused cache entries stay in memory before GC
 * networkMode: 'offlineFirst' — serve from cache when offline instead of showing error
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 min
      gcTime: 30 * 60 * 1000,      // 30 min
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      networkMode: 'offlineFirst',
    },
  },
});

/**
 * Persists the query cache to AsyncStorage so data survives app restarts.
 * Cache key is versioned — bump CACHE_BUSTER if you need to invalidate old caches.
 */
const CACHE_BUSTER = 'v1';

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: `setgo-query-cache-${CACHE_BUSTER}`,
  throttleTime: 1000, // write to storage at most once per second
});
