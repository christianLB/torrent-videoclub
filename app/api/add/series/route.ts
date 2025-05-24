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
    
    // Add series to Sonarr
    const sonarrSeries = await sonarrClient.addSeries({
      tvdbId: tmdbId, // Using TMDb ID as TVDB ID for simplicity
      title: tvShowDetails.name,
      year: tvShowDetails.year || 0,
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
  } catch (error: any) {
    console.error('Error in /api/add/series route:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while adding the series' },
      { status: 500 }
    );
  }
}
