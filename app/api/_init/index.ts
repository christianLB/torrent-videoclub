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
  
  // Force initialize CuratorService with hardcoded credentials
  // This ensures we always use real data regardless of environment variables
  CuratorService.forceInitialize(
    'http://192.168.1.62:9696',
    'c3cbb350fea74bf693fa117e10e28613',
    '2a64ce7c85da2b1542930819517136ea'
  );
  
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
