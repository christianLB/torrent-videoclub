/**
 * Server initialization file
 * 
 * This file is imported by the API route handlers to ensure
 * server-side initialization happens only once.
 */
import { CacheSchedulerService } from '@/lib/services/cache-scheduler';
import { CuratorService } from '@/lib/services/curator-service';

// Track initialization state
let initialized = false;

export async function initializeServer() {
  if (initialized) {
    return;
  }
  
  console.log('[Server] Initializing server components...');
  
  // Initialize CuratorService with environment variables
  // This ensures we use real data from the configured API endpoints
  CuratorService.initialize();
  
  // Log whether we're using real data
  console.log(`[Server] Using real data: ${CuratorService.isUsingRealData()}`);
  
  // If not using real data, log a warning
  if (!CuratorService.isUsingRealData()) {
    console.warn('[Server] Not using real data. Check environment variables:');
    console.warn('- PROWLARR_URL: ' + (process.env.PROWLARR_URL ? 'Set' : 'Not set'));
    console.warn('- PROWLARR_API_KEY: ' + (process.env.PROWLARR_API_KEY ? 'Set' : 'Not set'));
    console.warn('- TMDB_API_KEY: ' + (process.env.TMDB_API_KEY ? 'Set' : 'Not set'));
  }
  
  // Initialize the cache scheduler
  await CacheSchedulerService.initialize();
  
  initialized = true;
  console.log('[Server] Server initialization complete');
}

// Run initialization
initializeServer().catch(error => {
  console.error('[Server] Initialization failed:', error);
});

// Export a dummy object to ensure this module is not tree-shaken
export const __init = { initialized: true };
