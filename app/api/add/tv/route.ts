import { NextResponse } from 'next/server';
import { SonarrClient } from '../../../../lib/api/sonarr-client';
import { TMDbClient } from '../../../../lib/api/tmdb-client';
import { TMDBMediaItem } from '../../../../lib/types/tmdb';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { tmdbId } = body;

    // Validate request
    if (!tmdbId || typeof tmdbId !== 'number') {
      return NextResponse.json(
        { error: 'Valid TMDb ID (number) is required' },
        { status: 400 }
      );
    }

    // Initialize clients using environment variables
    const tmdbApiKey = process.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
      console.error('TMDB_API_KEY environment variable is not set.');
      return NextResponse.json(
        { error: 'Server configuration error: TMDB API key missing' },
        { status: 500 }
      );
    }
    const tmdbClient = new TMDbClient(tmdbApiKey);

    const sonarrUrl = process.env.SONARR_URL;
    const sonarrApiKey = process.env.SONARR_API_KEY;
    if (!sonarrUrl || !sonarrApiKey) {
      console.error('SONARR_URL or SONARR_API_KEY environment variable is not set.');
      return NextResponse.json(
        { error: 'Server configuration error: Sonarr connection details missing' },
        { status: 500 }
      );
    }
    const sonarrClient = new SonarrClient(sonarrUrl, sonarrApiKey);

    // Get TV series details from TMDb
    const seriesDetails: TMDBMediaItem | null = await tmdbClient.getTvShowDetails(tmdbId);

    if (!seriesDetails) {
      return NextResponse.json(
        { error: `TV series with TMDb ID ${tmdbId} not found` },
        { status: 404 }
      );
    }

    if (!seriesDetails.tvdb_id) {
      console.error(`TVDB ID not found for TMDb ID ${tmdbId}. Title: ${seriesDetails.title}`);
      return NextResponse.json(
        { error: `Cannot add to Sonarr: TVDB ID missing for '${seriesDetails.title}'. This might be due to missing data on TMDb or an issue fetching external IDs.` },
        { status: 404 } // Or 422 Unprocessable Entity
      );
    }

    // Add TV series to Sonarr
    const sonarrSeries = await sonarrClient.addSeries({
      tvdbId: seriesDetails.tvdb_id, 
      title: seriesDetails.title || 'Unknown Series',
      year: seriesDetails.firstAirDate ? new Date(seriesDetails.firstAirDate).getFullYear() : 0,
      qualityProfileId: 1, // Assuming 1 is a common default, or use 0 for Sonarr's default if supported
      rootFolderPath: process.env.SONARR_ROOT_FOLDER_PATH || '', // Allow override or use Sonarr's first available
      seasonFolder: true,
      monitored: true,
      addOptions: {
        ignoreEpisodesWithFiles: false,
        ignoreEpisodesWithoutFiles: false,
        searchForMissingEpisodes: true, // Automatically search for episodes after adding
      },
    });

    return NextResponse.json({
      success: true,
      message: `'${seriesDetails.title}' added to Sonarr successfully`,
      series: sonarrSeries,
    });
  } catch (error: any) {
    console.error('Error in /api/add/tv route:', error);
    let errorMessage = 'An error occurred while adding the TV series';
    if (error.message) {
        errorMessage = error.message;
    }
    // Avoid exposing too much detail in production for some errors
    if (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('Sonarr'))) {
        errorMessage = 'Could not connect to Sonarr. Please check configuration and ensure Sonarr is running.';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
