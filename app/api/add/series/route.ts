import { NextResponse } from 'next/server';
import { SonarrClient } from '../../../../lib/api/sonarr-client';
import { TMDbClient } from '../../../../lib/api/tmdb-client';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { tmdbId } = body;
    
    // Validate request
    if (!tmdbId) {
      return NextResponse.json(
        { error: 'TMDb ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize clients using environment variables
    const tmdbClient = new TMDbClient(
      process.env.TMDB_API_KEY || ''
    );
    
    const sonarrClient = new SonarrClient(
      process.env.SONARR_URL || 'http://localhost:8989',
      process.env.SONARR_API_KEY || ''
    );
    
    // Get TV show details from TMDb
    const tvShowDetails = await tmdbClient.getTvShowDetails(tmdbId);

    if (!tvShowDetails) {
      return NextResponse.json(
        { success: false, message: `TV show with TMDb ID ${tmdbId} not found.` },
        { status: 404 }
      );
    }

    const year = tvShowDetails.firstAirDate ? new Date(tvShowDetails.firstAirDate).getFullYear() : 0;
    const title = tvShowDetails.title || tvShowDetails.originalTitle || 'Untitled Series';

    // Add series to Sonarr
    const sonarrSeries = await sonarrClient.addSeries({
      tvdbId: tmdbId, // Using TMDb ID as TVDB ID for simplicity - Sonarr typically uses TVDB ID. Ensure this mapping is correct or fetch TVDB ID if necessary.
      title: title,
      year: year,
      qualityProfileId: 1, // Default quality profile ID, should be configurable
      rootFolderPath: '/tv', // Default root folder path, should be configurable
      seasonFolder: true,
      monitored: true,
      addOptions: {
        ignoreEpisodesWithFiles: false,
        ignoreEpisodesWithoutFiles: false,
        searchForMissingEpisodes: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Series added to Sonarr successfully',
      series: sonarrSeries,
    });
  } catch (error: unknown) {
    console.error('Error in /api/add/series route:', error);
    let errorMessage = 'An error occurred while adding the series';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Add Sonarr specific error checks if needed, similar to Radarr
      if (error.message.includes('ECONNREFUSED') || error.message.toLowerCase().includes('sonarr')) {
        errorMessage = 'Could not connect to Sonarr. Please check configuration and ensure Sonarr is running.';
      } else if (error.message.includes('No quality profiles found')) {
        errorMessage = 'Could not add series: Sonarr quality profiles are not configured or accessible.';
      } else if (error.message.includes('No root folders found')) {
        errorMessage = 'Could not add series: Sonarr root folders are not configured or accessible.';
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json(
      { success: false, message: errorMessage }, // Changed 'error' key to 'message'
      { status: 500 }
    );
  }
}
