import { NextRequest, NextResponse } from 'next/server';
import { CacheSchedulerService } from '@/lib/services/server/cache-scheduler';

export async function POST(_request: NextRequest) {
  try {
    const result = await CacheSchedulerService.refreshCache();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/cache/refresh] Failed to refresh cache:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to refresh cache' },
      { status: 500 }
    );
  }
}
