'use client';

/**
 * Cache Client API
 * 
 * Client-side interface for interacting with the Redis cache.
 * All Redis operations are performed via API calls to server endpoints.
 * This file is safe to import in client components.
 */

interface CacheStatus {
  redisConnected: boolean;
  cacheItems: {
    key: string;
    ttl: number;
    size: number;
    lastUpdated: string;
  }[];
  totalItems: number;
  totalSize: number;
}

interface CacheRefreshOptions {
  type: string;
  id?: string;
}

/**
 * Get the current status of the Redis cache
 */
export async function getCacheStatus(): Promise<CacheStatus> {
  try {
    const response = await fetch('/api/cache', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch cache status: ${response.status} - ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[CacheClient] Error fetching cache status:', error);
    throw error;
  }
}

/**
 * Refresh a specific cache item or category
 */
export async function refreshCache(options: CacheRefreshOptions): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/cache/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh cache: ${response.status} - ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[CacheClient] Error refreshing cache:', error);
    throw error;
  }
}

/**
 * Refresh all cache items
 */
export async function refreshAllCache(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/cache/refresh-all', {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh all cache: ${response.status} - ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[CacheClient] Error refreshing all cache:', error);
    throw error;
  }
}

/**
 * Clear all cache items
 */
export async function clearCache(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/cache/clear', {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to clear cache: ${response.status} - ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[CacheClient] Error clearing cache:', error);
    throw error;
  }
}

/**
 * Get featured content directly from the API
 */
export async function getFeaturedContent(category?: string): Promise<any> {
  try {
    const url = category 
      ? `/api/featured/category/${encodeURIComponent(category)}`
      : '/api/featured';
      
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch featured content: ${response.status} - ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[CacheClient] Error fetching featured content:', error);
    throw error;
  }
}
