import { NextResponse } from 'next/server';
import { CuratorService } from '@/lib/services/curator-service';

export async function GET() {
  try {
    // Only expose non-sensitive information
    const envVars = {
      PROWLARR_URL: process.env.PROWLARR_URL ? '***SET***' : '***NOT SET***',
      PROWLARR_API_KEY: process.env.PROWLARR_API_KEY ? '***SET***' : '***NOT SET***',
      TMDB_API_KEY: process.env.TMDB_API_KEY ? '***SET***' : '***NOT SET***',
      NODE_ENV: process.env.NODE_ENV,
      REDIS_URL: process.env.REDIS_URL ? '***SET***' : '***NOT SET***',
      REDIS_FEATURED_CONTENT_TTL: process.env.REDIS_FEATURED_CONTENT_TTL || '3600 (default)',
      usingRealData: CuratorService.isUsingRealData()
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envVars
    });
  } catch (error) {
    console.error('[API/debug] Error getting environment variables:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get environment variables',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
