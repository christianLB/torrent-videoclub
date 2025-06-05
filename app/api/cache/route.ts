import { NextResponse } from 'next/server';
import { CacheService } from '@/lib/services/server/cache-service';

export async function GET() {
  try {
    const [valid, ttl, featuredContent] = await Promise.all([
      CacheService.isFeaturedContentCacheValid(),
      CacheService.getFeaturedContentCacheTimeRemaining(),
      CacheService.getCachedFeaturedContent()
    ]);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      valid,
      ttl,
      featuredContent
    });
  } catch (error) {
    console.error('[api/cache] Failed to get cache status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get cache status' },
      { status: 500 }
    );
  }
}
