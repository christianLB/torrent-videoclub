import { NextResponse } from 'next/server';
import { SonarrClient } from '../../../../lib/api/sonarr-client';

// GET /api/sonarr/library endpoint

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

  } catch (error: any) {
    console.error('[API/sonarr/library] Error fetching Sonarr library TMDB IDs:', error);
    let errorMessage = 'Failed to fetch Sonarr library status.';
    if (error.message) {
      errorMessage = error.message;
    }
    // Check for connection refused or Sonarr specific errors
    if (error.message && (error.message.includes('ECONNREFUSED') || error.message.toLowerCase().includes('sonarr'))) {
      errorMessage = 'Could not connect to Sonarr. Please check configuration and ensure Sonarr is running.';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
