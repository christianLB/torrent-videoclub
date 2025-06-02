'use client';

import { useState, useEffect, useCallback } from 'react';

interface CacheKey {
  key: string;
  lastUpdated: string | null;
  ttl: number | null;
}

interface CacheCategory {
  count: number;
  keys: CacheKey[];
}

export interface CacheStatus {
  timestamp: string;
  totalCacheKeys: number;
  categories: Record<string, CacheCategory>;
}

interface UseCacheHealthOptions {
  pollingInterval?: number; // in milliseconds, default: 30000 (30 seconds)
  autoFetch?: boolean; // whether to automatically fetch on mount, default: true
}

interface UseCacheHealthResult {
  cacheStatus: CacheStatus | null;
  isLoading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
}

/**
 * Hook for monitoring the Redis cache health
 * 
 * This client-side hook fetches cache status information from the API
 * and can optionally poll for updates at a specified interval.
 */
export function useCacheHealth(options?: UseCacheHealthOptions): UseCacheHealthResult {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollingInterval = options?.pollingInterval || 30000; // Default: 30 seconds
  const autoFetch = options?.autoFetch !== false; // Default: true
  
  const fetchCacheStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cache', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch cache status: ${response.status}`);
      }
      
      const data = await response.json();
      setCacheStatus(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching cache status';
      setError(errorMessage);
      console.error('[useCacheHealth] Error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Set up polling effect
  useEffect(() => {
    if (autoFetch) {
      fetchCacheStatus();
    }
    
    // If polling interval is set, set up interval
    if (pollingInterval > 0) {
      const intervalId = setInterval(fetchCacheStatus, pollingInterval);
      
      // Clean up on unmount
      return () => clearInterval(intervalId);
    }
  }, [autoFetch, fetchCacheStatus, pollingInterval]);
  
  return {
    cacheStatus,
    isLoading,
    error,
    refreshStatus: fetchCacheStatus,
  };
}

export default useCacheHealth;
