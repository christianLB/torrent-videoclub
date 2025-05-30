import { NextResponse } from 'next/server';
import { RadarrClient } from '../../../../lib/api/radarr-client';
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
    
    const radarrClient = new RadarrClient(
      process.env.RADARR_URL || 'http://localhost:7878',
      process.env.RADARR_API_KEY || ''
    );
    
    // Get movie details from TMDb
    const movieDetails = await tmdbClient.getMovieDetails(tmdbId);
    
    // Handle case where movie details couldn't be found
    if (!movieDetails) {
      return NextResponse.json(
        { error: `Movie with TMDb ID ${tmdbId} not found` },
        { status: 404 }
      );
    }
    
    // Add movie to Radarr with auto-detected settings
    const radarrMovie = await radarrClient.addMovie({
      tmdbId: movieDetails.tmdbId, // Corrected: Use tmdbId from TMDBMediaItem
      title: movieDetails.title,
      year: movieDetails.releaseDate ? new Date(movieDetails.releaseDate).getFullYear() : 0, // Corrected: Derive year from releaseDate
      qualityProfileId: 0, // Will be auto-detected from Radarr
      rootFolderPath: '', // Will be auto-detected from Radarr
      minimumAvailability: 'released',
      monitored: true,
      addOptions: {
        searchForMovie: true // Automatically search for the movie after adding
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Movie added to Radarr successfully',
      movie: radarrMovie,
    });
  } catch (error: any) {
    console.error('Error in /api/add/movie route:', error);
    let errorMessage = 'An error occurred while adding the movie';
    let errorDetails = undefined;

    if (error.message) {
      errorMessage = error.message;
    }

    // Check for connection refused or Radarr specific errors
    if (error.message && (error.message.includes('ECONNREFUSED') || error.message.toLowerCase().includes('radarr'))) {
      errorMessage = 'Could not connect to Radarr. Please check configuration and ensure Radarr is running.';
      // Optionally, you can include more details if error.cause exists and is an Error object
      if (error.cause && typeof error.cause === 'object' && 'message' in error.cause) {
        // For ECONNREFUSED, error.cause might have address and port
        if ('address' in error.cause && 'port' in error.cause) {
            errorDetails = `Connection refused at ${error.cause.address}:${error.cause.port}`;
        } else {
            errorDetails = String(error.cause.message);
        }
      } 
    } else if (error.message && error.message.includes('No quality profiles found')) {
        errorMessage = 'Could not add movie: Radarr quality profiles are not configured or accessible.';
    } else if (error.message && error.message.includes('No root folders found')) {
        errorMessage = 'Could not add movie: Radarr root folders are not configured or accessible.';
    }

    return NextResponse.json(
      { error: errorMessage, ...(errorDetails && { details: errorDetails }) },
      { status: 500 }
    );
  }
}
