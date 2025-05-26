import { FeaturedContent } from "../types/featured-content";

/**
 * Constants for cache keys and expiration times
 */
const CACHE_KEYS = {
  FEATURED_CONTENT: 'featured_content',
};

const CACHE_EXPIRATION = {
  FEATURED_CONTENT: 1000 * 60 * 60, // 1 hour in milliseconds
};

/**
 * Cache service for managing browser storage of application data
 * Uses localStorage for persistence between sessions
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
      
      localStorage.setItem(
        CACHE_KEYS.FEATURED_CONTENT, 
        JSON.stringify(cacheItem)
      );
      
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
      const cachedData = localStorage.getItem(CACHE_KEYS.FEATURED_CONTENT);
      
      if (!cachedData) {
        return null;
      }
      
      const { data, timestamp } = JSON.parse(cachedData);
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
      localStorage.removeItem(CACHE_KEYS.FEATURED_CONTENT);
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
      const cachedData = localStorage.getItem(CACHE_KEYS.FEATURED_CONTENT);
      
      if (!cachedData) {
        return false;
      }
      
      const { timestamp } = JSON.parse(cachedData);
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
      const cachedData = localStorage.getItem(CACHE_KEYS.FEATURED_CONTENT);
      
      if (!cachedData) {
        return 0;
      }
      
      const { timestamp } = JSON.parse(cachedData);
      const now = Date.now();
      const elapsed = now - timestamp;
      
      return Math.max(0, CACHE_EXPIRATION.FEATURED_CONTENT - elapsed);
    } catch (error) {
      console.error('Error calculating cache time remaining:', error);
      return 0;
    }
  }
}
