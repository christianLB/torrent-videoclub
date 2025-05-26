/**
 * API route for cache refresh operations
 * 
 * This endpoint handles manual cache refresh requests from the UI
 */
import { NextRequest, NextResponse } from 'next/server';
import { redisService } from '@/lib/services/server/redis-service';
import { CuratorService } from '@/lib/services/curator-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, categoryId } = body;

    console.log(`[API/cache/refresh] Refresh request for type: ${type}, categoryId: ${categoryId || 'all'}`);

    switch (type) {
      case 'featured':
        // Clear and refresh featured content
        await redisService.deletePattern('featured:*');
        const freshContent = await CuratorService.getFeaturedContent();
        
        return NextResponse.json({
          success: true,
          message: 'Featured content refreshed successfully',
          data: freshContent
        });

      case 'category':
        if (!categoryId) {
          return NextResponse.json(
            { success: false, error: 'Category ID is required' },
            { status: 400 }
          );
        }

        // Clear and refresh specific category
        await redisService.delete(`featured:category:${categoryId}`);
        const freshCategory = await CuratorService.getCategory(categoryId);
        
        return NextResponse.json({
          success: true,
          message: `Category ${categoryId} refreshed successfully`,
          data: freshCategory
        });

      case 'all':
        // Clear all caches
        await CuratorService.clearCache();
        
        return NextResponse.json({
          success: true,
          message: 'All caches cleared successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid refresh type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API/cache/refresh] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh cache'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check cache status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (!key) {
      // Return general cache health status
      const isConnected = await redisService.ping();
      
      return NextResponse.json({
        connected: isConnected,
        message: isConnected ? 'Redis is connected' : 'Redis is not connected'
      });
    }

    // Check specific key
    const exists = await redisService.exists(key);
    const ttl = exists ? await redisService.ttl(key) : -1;

    return NextResponse.json({
      key,
      exists,
      ttl,
      expiresIn: ttl > 0 ? `${ttl} seconds` : ttl === -1 ? 'Key does not exist' : 'No expiration'
    });
  } catch (error) {
    console.error('[API/cache/refresh] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to check cache status' },
      { status: 500 }
    );
  }
}
