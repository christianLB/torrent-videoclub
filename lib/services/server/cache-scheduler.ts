/**
 * Cache Scheduler Service
 * 
 * This service uses node-cron to schedule automatic cache refreshes,
 * ensuring Redis is always populated with fresh data.
 *
 * MUST only be used in server-side contexts.
 */

// Import server-only package to enforce build-time errors when imported in client components

import { tmdbDataService } from '../tmdb-data-service';
import { cacheService } from './cache-service'; // Added cacheService import

// We'll use dynamic import for node-cron since it's a Node.js module
// and we want to avoid issues with client-side rendering
// Define a type for the node-cron module
type NodeCron = {
  schedule: (expression: string, callback: () => void) => void;
};

let cron: NodeCron | null = null;

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
      // Try to dynamically import node-cron
      try {
        const cronModule = await import('node-cron');
        cron = cronModule.default || cronModule;
        
        console.log('[CacheScheduler] Initializing cache scheduler with node-cron...');
        
        // Schedule cache refresh every hour
        this.scheduleHourlyRefresh();
        
        // We're not running an immediate refresh by default
        // as it's expensive and will happen at the scheduled time
        console.log('[CacheScheduler] Scheduled refresh will occur at the next hour mark');
      } catch (cronError: unknown) {
        const errorMessage = cronError instanceof Error ? cronError.message : 'Unknown error';
        console.warn('[CacheScheduler] node-cron not available:', errorMessage);
        console.log('[CacheScheduler] Will run in manual mode only (no automatic scheduling)');
        
        // Even without node-cron, we can still do a manual refresh
        // This allows the force-init endpoint to work
      }
      
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
    console.log('[CacheScheduler] Starting TMDB cache refresh...');
    try {
      const refreshTasks = [
        { name: 'Popular Movies (Page 1)', task: () => tmdbDataService.getOrFetchPopularMovies(1) },
        { name: 'Trending Movies Weekly (Page 1)', task: () => tmdbDataService.getOrFetchTrendingMovies('week', 1) },
        { name: 'Popular TV Shows (Page 1)', task: () => tmdbDataService.getOrFetchPopularTvShows(1) },
        { name: 'Trending TV Shows Weekly (Page 1)', task: () => tmdbDataService.getOrFetchTrendingTvShows('week', 1) },
        // Clear featured content cache to force refresh on next request
        { name: 'Featured Content Cache', task: async () => {
          //await cacheService.clearFeaturedContentCache();
          return [];
        } }
      ];

      console.log(`[CacheScheduler] Refreshing ${refreshTasks.length} content categories...`);

      const results = await Promise.allSettled(
        refreshTasks.map(async (taskInfo) => {
          try {
            console.log(`[CacheScheduler] Refreshing: ${taskInfo.name}`);
            const items = await taskInfo.task();
            const itemCount = Array.isArray(items) ? items.length : 'N/A';
            console.log(`[CacheScheduler] Successfully refreshed ${taskInfo.name}, ${itemCount} items fetched/updated.`);
            return {
              category: taskInfo.name,
              success: true,
              itemCount
            };
          } catch (error) {
            console.error(`[CacheScheduler] Error refreshing ${taskInfo.name}:`, error);
            return {
              category: taskInfo.name,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      const summary = results.map(r => {
        if (r.status === 'fulfilled') return r.value;
        // For rejected promises, structure is different, so we handle it to provide some info
        return { category: 'Unknown (Promise Rejected)', success: false, error: r.reason?.message || 'Unknown promise rejection' }; 
      });

      console.log('[CacheScheduler] Cache refresh completed.', { summary });
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        refreshedCategories: summary,
      };
    } catch (error) {
      console.error('[CacheScheduler] Critical error during cache refresh process:', error);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Critical error in refreshCache',
      };
    }
  }
}
