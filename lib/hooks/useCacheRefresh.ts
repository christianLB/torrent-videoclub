'use client';

import { useState, useCallback } from 'react';

interface UseCacheRefreshOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

interface CacheRefreshResult {
  refreshCache: (cacheKeys?: string[]) => Promise<void>;
  refreshAllCaches: () => Promise<void>;
  isRefreshing: boolean;
  error: string | null;
}

/**
 * Hook for refreshing Redis caches via API
 * 
 * This client-side hook provides methods to refresh specific caches or all caches.
 * It uses the /api/cache API endpoint to perform these operations server-side.
 */
export function useCacheRefresh(options?: UseCacheRefreshOptions): CacheRefreshResult {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCache = useCallback(async (cacheKeys?: string[]) => {
    if (!cacheKeys || cacheKeys.length === 0) {
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch('/api/cache/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cacheKeys }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh cache');
      }

      if (options?.onSuccess) {
        options.onSuccess(data.message || 'Cache refreshed successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error refreshing cache';
      setError(errorMessage);
      
      if (options?.onError) {
        options.onError(errorMessage);
      }
      
      console.error('[useCacheRefresh] Error:', errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  }, [options]);

  const refreshAllCaches = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch('/api/cache/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshAll: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh all caches');
      }

      if (options?.onSuccess) {
        options.onSuccess(data.message || 'All caches refreshed successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error refreshing all caches';
      setError(errorMessage);
      
      if (options?.onError) {
        options.onError(errorMessage);
      }
      
      console.error('[useCacheRefresh] Error refreshing all caches:', errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  }, [options]);

  return {
    refreshCache,
    refreshAllCaches,
    isRefreshing,
    error,
  };
}

export default useCacheRefresh;
