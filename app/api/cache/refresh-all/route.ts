/**
 * API route for manually triggering a full cache refresh
 * 
 * This endpoint allows administrators to manually trigger a complete
 * refresh of all cached data, including featured content and categories.
 */
import { NextResponse } from 'next/server';
import { CacheSchedulerService } from '@/lib/services/cache-scheduler';

export async function POST() {
  try {
    console.log('[API] Manual cache refresh triggered');
    const result = await CacheSchedulerService.refreshCache();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error during manual cache refresh:', error);
    return NextResponse.json(
      { 
        success: false, 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
