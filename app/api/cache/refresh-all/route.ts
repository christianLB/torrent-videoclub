/**
 * API route for manually triggering a full cache refresh
 * 
 * This endpoint allows administrators to manually trigger a complete
 * refresh of all cached data, including featured content and categories.
 */
import { NextRequest, NextResponse } from 'next/server';
import { CacheSchedulerService } from '@/lib/services/cache-scheduler';

// Import the initialization module to ensure the cache scheduler runs
import { __init } from '@/app/api/_init';

export async function POST(request: NextRequest) {
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
