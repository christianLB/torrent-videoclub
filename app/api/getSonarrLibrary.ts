import { NextResponse } from 'next/server';
import { SonarrClient } from '../../lib/api/sonarr-client';

// This should be named route.ts and placed in app/api/sonarr/library/route.ts
// For Next.js App Router to recognize it as GET /api/sonarr/library

export async function GET() {
  try {
    const sonarrUrl = process.env.SONARR_URL;
    const sonarrApiKey = process.env.SONARR_API_KEY;

    if (!sonarrUrl || !sonarrApiKey) {
      console.error('[API/sonarr/library] Sonarr URL or API Key is not configured.');
      return NextResponse.json(
        { error: 'Sonarr service is not configured.' },
        { status: 503 } // Service Unavailable
      );
    }

    const sonarrClient = new SonarrClient(sonarrUrl, sonarrApiKey);
    const tmdbIds = await sonarrClient.getLibraryTmdbIds();

    return NextResponse.json({ tmdbIds });

  } catch (error: unknown) {
    console.error('[API/sonarr/library] Error fetching Sonarr library TMDB IDs:', error);
    let errorMessage = 'Failed to fetch Sonarr library status.';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for connection refused or Sonarr specific errors
      if (('code' in error && error.code === 'ECONNREFUSED') || error.message.toLowerCase().includes('sonarr')) {
        errorMessage = 'Could not connect to Sonarr. Please check configuration and ensure Sonarr is running.';
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
