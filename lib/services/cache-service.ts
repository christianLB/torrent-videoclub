import { FeaturedContent } from "../types/featured-content";

/**
 * Constants for cache keys and expiration times
 */
export const CACHE_KEYS = {
  FEATURED_CONTENT: 'featured_content',
};

export const CACHE_EXPIRATION = {
  FEATURED_CONTENT: 1000 * 60 * 60, // 1 hour in milliseconds
};

// Memory cache for server-side environments
let memoryCache: Record<string, any> = {};

/**
 * Check if running in browser environment
 * This is needed because localStorage is only available in browser
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Cache service for managing storage of application data
 * Uses localStorage in browser and memory cache on server
 */
export class CacheService {
  /**
   * Stores featured content in cache with expiration time
   */
  static cacheFeaturedContent(content: FeaturedContent): void {
    try {
      const cacheItem = {
        data: content,
        timestamp: Date.now(),
      };
      
      if (isBrowser()) {
        // Browser environment - use localStorage
        localStorage.setItem(
          CACHE_KEYS.FEATURED_CONTENT, 
          JSON.stringify(cacheItem)
        );
      } else {
        // Server environment - use memory cache
        memoryCache[CACHE_KEYS.FEATURED_CONTENT] = cacheItem;
      }
      
      console.log('Featured content cached successfully');
    } catch (error) {
      console.error('Failed to cache featured content:', error);
    }
  }

  /**
   * Retrieves featured content from cache if available and not expired
   * @returns Cached featured content or null if not available/expired
   */
  static getCachedFeaturedContent(): FeaturedContent | null {
    try {
      let cacheItem: { data: FeaturedContent, timestamp: number } | null = null;
      
      if (isBrowser()) {
        // Browser environment - use localStorage
        const cachedData = localStorage.getItem(CACHE_KEYS.FEATURED_CONTENT);
        if (cachedData) {
          cacheItem = JSON.parse(cachedData);
        }
      } else {
        // Server environment - use memory cache
        cacheItem = memoryCache[CACHE_KEYS.FEATURED_CONTENT] || null;
      }
      
      if (!cacheItem) {
        return null;
      }
      
      const { data, timestamp } = cacheItem;
      const now = Date.now();
      
      // Check if cache is expired
      if (now - timestamp > CACHE_EXPIRATION.FEATURED_CONTENT) {
        console.log('Featured content cache expired');
        return null;
      }
      
      console.log('Retrieved featured content from cache');
      return data as FeaturedContent;
    } catch (error) {
      console.error('Failed to retrieve cached featured content:', error);
      return null;
    }
  }

  /**
   * Clears the featured content cache
   */
  static clearFeaturedContentCache(): void {
    try {
      if (isBrowser()) {
        // Browser environment - use localStorage
        localStorage.removeItem(CACHE_KEYS.FEATURED_CONTENT);
      } else {
        // Server environment - use memory cache
        delete memoryCache[CACHE_KEYS.FEATURED_CONTENT];
      }
      console.log('Featured content cache cleared');
    } catch (error) {
      console.error('Failed to clear featured content cache:', error);
    }
  }

  /**
   * Checks if the featured content cache is valid (exists and not expired)
   */
  static isFeaturedContentCacheValid(): boolean {
    try {
      let cacheItem: { data: FeaturedContent, timestamp: number } | null = null;
      
      if (isBrowser()) {
        // Browser environment - use localStorage
        const cachedData = localStorage.getItem(CACHE_KEYS.FEATURED_CONTENT);
        if (cachedData) {
          cacheItem = JSON.parse(cachedData);
        }
      } else {
        // Server environment - use memory cache
        cacheItem = memoryCache[CACHE_KEYS.FEATURED_CONTENT] || null;
      }
      
      if (!cacheItem) {
        return false;
      }
      
      const { timestamp } = cacheItem;
      const now = Date.now();
      
      return (now - timestamp) <= CACHE_EXPIRATION.FEATURED_CONTENT;
    } catch (error) {
      console.error('Error checking featured content cache validity:', error);
      return false;
    }
  }

  /**
   * Gets the remaining time until cache expiration in milliseconds
   * @returns Time remaining in milliseconds, or 0 if cache is expired/not available
   */
  static getFeaturedContentCacheTimeRemaining(): number {
    try {
      let cacheItem: { data: FeaturedContent, timestamp: number } | null = null;
      
      if (isBrowser()) {
        // Browser environment - use localStorage
        const cachedData = localStorage.getItem(CACHE_KEYS.FEATURED_CONTENT);
        if (cachedData) {
          cacheItem = JSON.parse(cachedData);
        }
      } else {
        // Server environment - use memory cache
        cacheItem = memoryCache[CACHE_KEYS.FEATURED_CONTENT] || null;
      }
      
      if (!cacheItem) {
        return 0;
      }
      
      const { timestamp } = cacheItem;
      const now = Date.now();
      const elapsed = now - timestamp;
      
      return Math.max(0, CACHE_EXPIRATION.FEATURED_CONTENT - elapsed);
    } catch (error) {
      console.error('Error calculating cache time remaining:', error);
      return 0;
    }
  }
}
