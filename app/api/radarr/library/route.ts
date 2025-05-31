import { NextResponse } from 'next/server';
import { RadarrClient } from '../../../../lib/api/radarr-client';

// GET /api/radarr/library endpoint

export async function GET() {
  try {
    const radarrUrl = process.env.RADARR_URL;
    const radarrApiKey = process.env.RADARR_API_KEY;

    if (!radarrUrl || !radarrApiKey) {
      console.error('[API/radarr/library] Radarr URL or API Key is not configured.');
      return NextResponse.json(
        { error: 'Radarr service is not configured.' },
        { status: 503 } // Service Unavailable
      );
    }

    const radarrClient = new RadarrClient(radarrUrl, radarrApiKey);
    const tmdbIds = await radarrClient.getLibraryTmdbIds();

    return NextResponse.json({ tmdbIds });

  } catch (error: unknown) {
    console.error('[API/radarr/library] Error fetching Radarr library TMDB IDs:', error);
    let errorMessage = 'Failed to fetch Radarr library status.';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for connection refused or Radarr specific errors
      if ('code' in error && error.code === 'ECONNREFUSED') {
        errorMessage = 'Radarr instance is not reachable. Please check if Radarr is running and accessible.';
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
