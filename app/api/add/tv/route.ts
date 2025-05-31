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

    // Fetch Sonarr quality profiles
    let qualityProfileIdToUse = 1; // Default fallback
    try {
      const qualityProfiles = await sonarrClient.getQualityProfiles();
      if (qualityProfiles && qualityProfiles.length > 0) {
        let preferredProfile = qualityProfiles.find(p => p.name.toLowerCase() === 'any');
        if (!preferredProfile) {
          preferredProfile = qualityProfiles.find(p => p.name.toLowerCase() === 'standard');
        }
        if (!preferredProfile) {
          preferredProfile = qualityProfiles[0]; // Take the first one if specific names not found
        }
        qualityProfileIdToUse = preferredProfile.id;
        console.log(`[Sonarr AddTV] Using quality profile: ID=${qualityProfileIdToUse}, Name='${preferredProfile.name}'`);
      } else {
        console.warn('[Sonarr AddTV] No quality profiles found or fetch failed. Falling back to default ID 1.');
      }
    } catch (profileError) {
      console.error('[Sonarr AddTV] Error fetching quality profiles, falling back to default ID 1:', profileError);
    }

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

    // Prepare Sonarr series data
    const seriesDataForSonarr = {
      tvdbId: seriesDetails.tvdb_id,
      title: seriesDetails.title || 'Unknown Series',
      year: seriesDetails.firstAirDate ? new Date(seriesDetails.firstAirDate).getFullYear() : 0,
      qualityProfileId: qualityProfileIdToUse,
      rootFolderPath: '', // Let SonarrClient determine this from Sonarr's available root folders
      seasonFolder: true,
      monitored: true,
      addOptions: {
        ignoreEpisodesWithFiles: false,
        ignoreEpisodesWithoutFiles: false,
        searchForMissingEpisodes: true, // Automatically search for episodes after adding
      },
    };

    console.log('[Sonarr AddTV] Attempting to add series with payload:', JSON.stringify(seriesDataForSonarr, null, 2));

    // Add TV series to Sonarr
    const sonarrSeries = await sonarrClient.addSeries(seriesDataForSonarr);

    return NextResponse.json({
      success: true,
      message: `'${seriesDetails.title}' added to Sonarr successfully`,
      series: sonarrSeries,
    });
  } catch (error: unknown) {
    console.error('Error in /api/add/tv route:', error);
    let errorMessage = 'An error occurred while adding the TV series';

    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for connection refused or Sonarr specific errors
      if (error.message.includes('ECONNREFUSED') || error.message.toLowerCase().includes('sonarr')) {
        errorMessage = 'Could not connect to Sonarr. Please check configuration and ensure Sonarr is running.';
      } else if (error.message.includes('No quality profiles found')) {
        errorMessage = 'Could not add series: Sonarr quality profiles are not configured or accessible.';
      } else if (error.message.includes('No root folders found')) {
        errorMessage = 'Could not add series: Sonarr root folders are not configured or accessible.';
      }
      // Add any other specific error message checks for Sonarr here
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
