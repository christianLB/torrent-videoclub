/**
 * API route for clearing all caches
 * 
 * This endpoint allows client-side code to trigger cache clearing
 * without directly importing Redis-dependent services.
 */
import { NextResponse } from 'next/server';
import { CuratorService } from '@/lib/services/curator-service';

export async function POST() {
  try {
    await CuratorService.clearCache();
    
    return NextResponse.json({
      success: true,
      message: 'All caches cleared successfully'
    });
  } catch (error) {
    console.error('[API/cache/clear] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear cache'
      },
      { status: 500 }
    );
  }
}
