/**
 * API route for featured content
 */
import { NextResponse } from 'next/server';
// Corrected import path assuming curator-service.ts is in lib/services/server/
import CuratorServiceModule from '@/lib/services/server/curator-service'; 
import { TrendingContentClient } from '@/lib/services/server/trending-content-client';
import { CacheService } from '@/lib/services/server/cache-service';
import { ProwlarrClient } from '@/lib/services/server/prowlarr-client';

/**
 * GET handler for /api/featured
 * Returns featured content for the homepage
 */
export async function GET() {
  try {
    console.log('Fetching featured content in /api/featured route...');

    // Instantiate dependencies
    const prowlarrUrl = process.env.PROWLARR_URL;
    const prowlarrApiKey = process.env.PROWLARR_API_KEY;

    let trendingClientInstance: TrendingContentClient | null = null;
    if (prowlarrUrl && prowlarrApiKey) {
      const prowlarrClient = new ProwlarrClient(prowlarrUrl, prowlarrApiKey);
      trendingClientInstance = new TrendingContentClient(prowlarrClient as any);
    } else {
      console.warn('/api/featured: PROWLARR_URL or PROWLARR_API_KEY is not set. TrendingContentClient will be null. This might be expected during build if not fetching live data.');
    }
    
    // Pass dependencies to the getFeaturedContent function from the imported module
    const featuredContent = await CuratorServiceModule.getFeaturedContent(
      trendingClientInstance,
      CacheService // Pass the class itself
    );
    
    return NextResponse.json(featuredContent, { status: 200 });
  } catch (error) {
    console.error('Error in /api/featured route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
