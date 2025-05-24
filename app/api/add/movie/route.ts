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
      tmdbId: movieDetails.id,
      title: movieDetails.title,
      year: movieDetails.year || 0,
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
    return NextResponse.json(
      { error: error.message || 'An error occurred while adding the movie' },
      { status: 500 }
    );
  }
}
