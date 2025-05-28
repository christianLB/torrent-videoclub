/**
 * Debug API route for forcing CuratorService initialization
 * 
 * This endpoint allows developers to force initialize the CuratorService
 * with specific API credentials for testing purposes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { CuratorService } from '@/lib/services/curator-service';
import { CacheSchedulerService } from '@/lib/services/cache-scheduler';

export async function POST(request: NextRequest) {
  try {
    // Get credentials from request body or use defaults from environment
    const { prowlarrUrl, prowlarrApiKey, tmdbApiKey } = await request.json();
    
    // Update the server config with provided values
    if (prowlarrUrl) process.env.PROWLARR_URL = prowlarrUrl;
    if (prowlarrApiKey) process.env.PROWLARR_API_KEY = prowlarrApiKey;
    if (tmdbApiKey) process.env.TMDB_API_KEY = tmdbApiKey;
    
    // Force initialize with the updated environment variables
    CuratorService.forceInitialize({
      prowlarrUrl: process.env.PROWLARR_URL || '',
      prowlarrApiKey: process.env.PROWLARR_API_KEY || '',
      tmdbApiKey: process.env.TMDB_API_KEY || ''
    });
    
    // Clear existing cache to ensure fresh data
    await CuratorService.clearCache();
    
    // Trigger a refresh to populate cache with real data
    let refreshResult = null;
    try {
      refreshResult = await CacheSchedulerService.refreshCache();
    } catch (error) {
      console.warn('Cache refresh failed, but continuing:', error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'CuratorService force initialized and cache refreshed',
      usingRealData: CuratorService.isUsingRealData(),
      refreshResult: refreshResult || { message: 'Cache refresh may have failed, check logs' },
      config: {
        prowlarrUrl: process.env.PROWLARR_URL ? '***REDACTED***' : 'Not set',
        prowlarrApiKey: process.env.PROWLARR_API_KEY ? '***REDACTED***' : 'Not set',
        tmdbApiKey: process.env.TMDB_API_KEY ? '***REDACTED***' : 'Not set'
      }
    });
  } catch (error) {
    console.error('[API/debug] Error force initializing CuratorService:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
