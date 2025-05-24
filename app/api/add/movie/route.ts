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
    
    // Add movie to Radarr
    const radarrMovie = await radarrClient.addMovie({
      tmdbId: movieDetails.id,
      title: movieDetails.title,
      year: movieDetails.year || 0,
      qualityProfileId: 1, // Default quality profile ID, should be configurable
      rootFolderPath: '/movies', // Default root folder path, should be configurable
      minimumAvailability: 'released',
      monitored: true,
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
