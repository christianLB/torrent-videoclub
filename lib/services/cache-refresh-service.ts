/**
 * Cache Refresh Service
 * 
 * Handles background refresh of cached content to ensure data is up-to-date
 * while maintaining fast performance for users.
 * 
 * This is a client-safe service that uses the CacheAPIClient to trigger
 * cache refreshes without directly importing server-only modules.
 */
import { CacheAPIClient } from './cache-api-client';

export class CacheRefreshService {
  private static refreshIntervalId: NodeJS.Timeout | null = null;
  private static readonly DEFAULT_REFRESH_INTERVAL = 1000 * 60 * 60; // 1 hour in milliseconds

  /**
   * Starts a background refresh loop for featured content
   * @param interval Optional custom interval in milliseconds
   */
  static startFeaturedContentRefresh(interval = CacheRefreshService.DEFAULT_REFRESH_INTERVAL): void {
    // Clear any existing interval
    CacheRefreshService.stopFeaturedContentRefresh();
    
    console.log(`Starting featured content refresh every ${interval / 1000 / 60} minutes`);
    
    // Set up new interval
    CacheRefreshService.refreshIntervalId = setInterval(() => {
      console.log('Background refresh of featured content triggered');
      CacheRefreshService.refreshFeaturedContent()
        .then(() => console.log('Background refresh completed'))
        .catch(error => console.error('Background refresh failed:', error));
    }, interval);
  }

  /**
   * Stops the background refresh loop for featured content
   */
  static stopFeaturedContentRefresh(): void {
    if (CacheRefreshService.refreshIntervalId) {
      clearInterval(CacheRefreshService.refreshIntervalId);
      CacheRefreshService.refreshIntervalId = null;
      console.log('Featured content refresh stopped');
    }
  }

  /**
   * Manually triggers a refresh of the featured content cache
   */
  static async refreshFeaturedContent(): Promise<void> {
    try {
      // Use the client-safe API client to trigger a refresh
      const result = await CacheAPIClient.refreshFeaturedContent();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to refresh featured content');
      }
      
      console.log('Featured content refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh featured content:', error);
      throw error;
    }
  }
}
