/**
 * Server initialization file
 * 
 * This file is imported by the API route handlers to ensure
 * server-side initialization happens only once.
 */
import { CacheSchedulerService } from '@/lib/services/cache-scheduler';

// Track initialization state
let initialized = false;

export async function initializeServer() {
  if (initialized) {
    return;
  }
  
  console.log('[Server] Initializing server components...');
  
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
