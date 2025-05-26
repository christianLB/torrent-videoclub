/**
 * Cache Scheduler Service
 * 
 * This service uses node-cron to schedule automatic cache refreshes,
 * ensuring Redis is always populated with fresh data.
 */
import { CuratorService } from './curator-service';

// We'll use dynamic import for node-cron since it's a Node.js module
// and we want to avoid issues with client-side rendering
let cron: any;

// Flag to track if scheduler is initialized
let initialized = false;

/**
 * Cache Scheduler Service
 */
export class CacheSchedulerService {
  /**
   * Initialize the cache scheduler
   * This should be called once during server startup
   */
  static async initialize() {
    // Only run on the server
    if (typeof window !== 'undefined' || initialized) {
      return;
    }
    
    try {
      // Dynamically import node-cron
      const cronModule = await import('node-cron');
      cron = cronModule.default || cronModule;
      
      console.log('[CacheScheduler] Initializing cache scheduler...');
      
      // Schedule cache refresh every hour
      this.scheduleHourlyRefresh();
      
      // We're not running an immediate refresh by default
      // as it's expensive and will happen at the scheduled time
      console.log('[CacheScheduler] Scheduled refresh will occur at the next hour mark');
      
      initialized = true;
      console.log('[CacheScheduler] Cache scheduler initialized successfully');
    } catch (error) {
      console.error('[CacheScheduler] Failed to initialize cache scheduler:', error);
    }
  }
  
  /**
   * Schedule hourly cache refresh
   */
  private static scheduleHourlyRefresh() {
    if (!cron) {
      console.error('[CacheScheduler] Cannot schedule refresh: cron module not loaded');
      return;
    }
    
    // Run every hour at minute 0
    cron.schedule('0 * * * *', () => {
      console.log('[CacheScheduler] Running scheduled cache refresh...');
      this.refreshCache();
    });
    
    console.log('[CacheScheduler] Hourly cache refresh scheduled');
  }
  
  /**
   * Refresh all cache data
   */
  static async refreshCache() {
    console.log('[CacheScheduler] Starting cache refresh...');
    try {
      // First, refresh the main featured content
      console.log('[CacheScheduler] Refreshing featured content...');
      const featuredContent = await CuratorService.getFeaturedContent();
      
      // Then refresh each predefined category
      const categories = ['trending-movies', 'popular-tv', 'new-releases', '4k-content'];
      console.log(`[CacheScheduler] Refreshing ${categories.length} categories...`);
      
      const results = await Promise.all(
        categories.map(async (categoryId) => {
          try {
            const category = await CuratorService.getCategory(categoryId);
            return {
              categoryId,
              success: !!category,
              itemCount: category?.items?.length || 0
            };
          } catch (error) {
            console.error(`[CacheScheduler] Error refreshing category ${categoryId}:`, error);
            return {
              categoryId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );
      
      console.log('[CacheScheduler] Cache refresh completed successfully', {
        featuredContent: {
          carouselItems: featuredContent.featuredCarouselItems?.length || 0,
          categories: featuredContent.categories?.length || 0
        },
        categories: results
      });
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        featuredContent: {
          carouselItems: featuredContent.featuredCarouselItems?.length || 0,
          categories: featuredContent.categories?.length || 0
        },
        categories: results
      };
    } catch (error) {
      console.error('[CacheScheduler] Error refreshing cache:', error);
      return { 
        success: false, 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
