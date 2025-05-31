/**
 * Debug API route for checking cache status
 * 
 * This endpoint allows developers to check if real data is being used
 * and what's currently in the Redis cache.
 */
import { NextResponse } from 'next/server';
import { redisService } from '@/lib/services/server/redis-service';
import { CuratorService } from '@/lib/services/curator-service';

export async function GET() {
  try {
    // Get all Redis keys related to our application
    const allKeys = await redisService.getKeys('featured:*');
    
    // Get TTL for each key
    const keyDetails = await Promise.all(
      allKeys.map(async (key: string) => {
        const ttl = await redisService.ttl(key);
        return {
          key,
          ttl,
          expiresIn: ttl > 0 ? `${Math.floor(ttl / 60)} minutes, ${ttl % 60} seconds` : 'No expiration',
        };
      })
    );
    
    // Check if we're using real data or mock data
    const isMockData = !CuratorService.isUsingRealData();
    
    // Check if a sample of data exists
    const featuredContent = await redisService.get<{
      featuredCarouselItems?: unknown[];
      categories?: unknown[];
    }>('featured:content');
    
    const sampleCategory = await redisService.get<{
      items?: unknown[];
    }>('featured:category:trending-movies');
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cacheStatus: {
        totalKeys: allKeys.length,
        keys: keyDetails,
      },
      dataSource: {
        usingMockData: isMockData,
        usingRealData: !isMockData,
        reason: isMockData ? 'API clients not initialized or no data available' : 'Using real data from Prowlarr/TMDb',
      },
      dataSamples: {
        hasFeaturedContent: !!featuredContent,
        featuredContentItemCount: featuredContent ? 
          `${featuredContent.featuredCarouselItems?.length || 0} carousel items, ${featuredContent.categories?.length || 0} categories` : 
          'No data',
        hasTrendingMovies: !!sampleCategory,
        trendingMoviesItemCount: sampleCategory ? sampleCategory.items?.length || 0 : 'No data',
      }
    });
  } catch (error) {
    console.error('[API/debug] Error getting cache status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get cache status',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
