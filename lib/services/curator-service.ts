/**
 * Curator Service
 * 
 * Responsible for managing and providing featured content for the application.
 * In the first iteration, this will use mock data, but can be extended to use
 * real data from Prowlarr, Radarr, Sonarr, and TMDb in the future.
 */
import { getMockFeaturedContent } from './mock-data';
import { FeaturedContent, EnhancedMediaItem, FeaturedCategory } from '../types/featured-content';
import { CacheService } from './cache-service';

/**
 * Service for curating and providing featured content
 */
export class CuratorService {
  /**
   * Get the featured content for the homepage
   * 
   * Uses caching to improve performance and reduce API calls
   * In this first iteration, we're using mock data
   * In future iterations, this will use real data from Prowlarr and TMDb
   */
  static async getFeaturedContent(): Promise<FeaturedContent> {
    try {
      // First check if we have valid cached content
      const cachedContent = CacheService.getCachedFeaturedContent();
      if (cachedContent) {
        console.log('Using cached featured content');
        return cachedContent;
      }

      console.log('Cache miss - fetching fresh featured content');
      
      // For the initial implementation, we're using static mock data
      // In a future version, this would:
      // 1. Fetch trending content from Prowlarr based on configuration
      // 2. Enrich with TMDb metadata
      // 3. Get library status from Radarr/Sonarr
      // 4. Cache the results
      const featuredContent = getMockFeaturedContent();
      
      // Cache the results for future use
      CacheService.cacheFeaturedContent(featuredContent);
      
      return featuredContent;
    } catch (error) {
      console.error('Error in CuratorService.getFeaturedContent:', error);
      
      // If there's an error, try to use cached content as a fallback
      const cachedContent = CacheService.getCachedFeaturedContent();
      if (cachedContent) {
        console.log('Using cached content as fallback after error');
        return cachedContent;
      }
      
      throw new Error('Failed to fetch featured content');
    }
  }

  /**
   * Get a specific category of featured content
   * @param categoryId The ID of the category to retrieve
   */
  static async getCategory(categoryId: string): Promise<FeaturedCategory | null> {
    try {
      const { categories } = await CuratorService.getFeaturedContent();
      return categories.find(category => category.id === categoryId) || null;
    } catch (error) {
      console.error(`Error in CuratorService.getCategory(${categoryId}):`, error);
      throw new Error(`Failed to fetch category: ${categoryId}`);
    }
  }

  /**
   * Check if a media item is in the user's library
   * In this implementation, we're using mock data
   * 
   * @param guid The unique identifier of the media item
   */
  static isInLibrary(guid: string): boolean {
    // In a future implementation, this would check Radarr/Sonarr APIs
    // For now, we're using the pre-defined status in our mock data
    const mockData = getMockFeaturedContent();
    
    // Check the featured item
    if (mockData.featuredItem.guid === guid) {
      return mockData.featuredItem.inLibrary;
    }
    
    // Check all categories
    for (const category of mockData.categories) {
      const item = category.items.find((item: EnhancedMediaItem) => item.guid === guid);
      if (item) {
        return item.inLibrary;
      }
    }
    
    return false;
  }

  /**
   * Check if a media item is currently downloading
   * In this implementation, we're using mock data
   * 
   * @param guid The unique identifier of the media item
   */
  static isDownloading(guid: string): { downloading: boolean; progress?: number } {
    // In a future implementation, this would check Radarr/Sonarr APIs
    // For now, we're using the pre-defined status in our mock data
    const mockData = getMockFeaturedContent();
    
    // Check the featured item
    if (mockData.featuredItem.guid === guid) {
      return {
        downloading: mockData.featuredItem.downloading,
        progress: mockData.featuredItem.downloadProgress
      };
    }
    
    // Check all categories
    for (const category of mockData.categories) {
      const item = category.items.find((item: EnhancedMediaItem) => item.guid === guid);
      if (item) {
        return {
          downloading: item.downloading,
          progress: item.downloadProgress
        };
      }
    }
    
    return { downloading: false };
  }

  /**
   * Fetch fresh featured content, bypassing the cache
   * This is used by the cache refresh service to update the cache
   */
  static async fetchFreshFeaturedContent(): Promise<FeaturedContent> {
    try {
      // For the initial implementation, we're using static mock data
      // In a future version, this would actually fetch from real APIs:
      // 1. Fetch trending content from Prowlarr based on configuration
      // 2. Enrich with TMDb metadata
      // 3. Get library status from Radarr/Sonarr
      
      // Simulate a network delay to mimic real API calls
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return getMockFeaturedContent();
    } catch (error) {
      console.error('Error fetching fresh featured content:', error);
      throw new Error('Failed to fetch fresh featured content');
    }
  }
}
