/**
 * Cache API Client
 * 
 * Client-side service for interacting with the cache API endpoints
 * This ensures all cache operations go through the server
 */

export interface CacheRefreshResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export interface CacheStatusResponse {
  connected?: boolean;
  message?: string;
  key?: string;
  exists?: boolean;
  ttl?: number;
  expiresIn?: string;
  error?: string;
}

export class CacheAPIClient {
  private static baseUrl = '/api/cache';

  /**
   * Refresh all featured content
   */
  static async refreshFeaturedContent(): Promise<CacheRefreshResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'featured' }),
      });

      return await response.json();
    } catch (error) {
      console.error('[CacheAPIClient] Error refreshing featured content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh featured content',
      };
    }
  }

  /**
   * Refresh a specific category
   */
  static async refreshCategory(categoryId: string): Promise<CacheRefreshResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'category', categoryId }),
      });

      return await response.json();
    } catch (error) {
      console.error(`[CacheAPIClient] Error refreshing category ${categoryId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh category',
      };
    }
  }

  /**
   * Clear all caches
   */
  static async clearAllCaches(): Promise<CacheRefreshResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'all' }),
      });

      return await response.json();
    } catch (error) {
      console.error('[CacheAPIClient] Error clearing all caches:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear caches',
      };
    }
  }
  
  /**
   * Direct method to clear the cache (uses dedicated endpoint)
   */
  static async clearCache(): Promise<CacheRefreshResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('[CacheAPIClient] Error clearing cache:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cache',
      };
    }
  }

  /**
   * Check cache connection status
   */
  static async checkCacheHealth(): Promise<CacheStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/refresh`);
      return await response.json();
    } catch (error) {
      console.error('[CacheAPIClient] Error checking cache health:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Failed to check cache health',
      };
    }
  }

  /**
   * Check if a specific cache key exists
   */
  static async checkCacheKey(key: string): Promise<CacheStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/refresh?key=${encodeURIComponent(key)}`);
      return await response.json();
    } catch (error) {
      console.error(`[CacheAPIClient] Error checking cache key ${key}:`, error);
      return {
        key,
        exists: false,
        error: error instanceof Error ? error.message : 'Failed to check cache key',
      };
    }
  }

  /**
   * Trigger a background refresh without waiting for completion
   */
  static async triggerBackgroundRefresh(): Promise<void> {
    try {
      // Fire and forget - don't wait for response
      fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'featured' }),
      }).catch(err => {
        console.error('[CacheAPIClient] Background refresh error:', err);
      });
    } catch (error) {
      console.error('[CacheAPIClient] Error triggering background refresh:', error);
    }
  }
}
