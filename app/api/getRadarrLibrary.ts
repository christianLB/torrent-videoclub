import { NextResponse } from 'next/server';
import { RadarrClient } from '../../lib/api/radarr-client'; // Assuming @ maps to project root

// This should be named route.ts and placed in app/api/radarr/library/route.ts
// For Next.js App Router to recognize it as GET /api/radarr/library

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

  } catch (error: any) {
    console.error('[API/radarr/library] Error fetching Radarr library TMDB IDs:', error);
    let errorMessage = 'Failed to fetch Radarr library status.';
    if (error.message) {
      errorMessage = error.message;
    }
    if (error.message && (error.message.includes('ECONNREFUSED') || error.message.toLowerCase().includes('radarr'))) {
      errorMessage = 'Could not connect to Radarr. Please check configuration and ensure Radarr is running.';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
