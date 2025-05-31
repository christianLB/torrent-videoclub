import { NextResponse } from 'next/server';
import { ProwlarrClient } from '../../../lib/api/prowlarr-client';
import { TMDbClient } from '../../../lib/api/tmdb-client';

export async function GET(request: Request) {
  try {
    // Get query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const yearFilter = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
    
    // Initialize clients using environment variables
    const prowlarrClient = new ProwlarrClient(
      process.env.PROWLARR_URL || 'http://localhost:9696',
      process.env.PROWLARR_API_KEY || ''
    );
    
    const tmdbClient = new TMDbClient(
      process.env.TMDB_API_KEY || ''
    );
    
    // Get movies from Prowlarr
    const prowlarrMovies = await prowlarrClient.searchMovies(query);
    
    // Filter movies by year if provided
    const filteredProwlarrMovies = yearFilter 
      ? prowlarrMovies.filter(movie => movie.year === yearFilter)
      : prowlarrMovies;
    
    // Get movie metadata from TMDb (will return empty array if API key is missing)
    const tmdbMovies = await tmdbClient.searchMovies(query);
    
    // Check if TMDb API is working (has API key)
    const hasTmdbData = tmdbMovies.length > 0 || process.env.TMDB_API_KEY;
    console.log(`TMDb integration ${hasTmdbData ? 'is available' : 'is NOT available - results will have limited metadata'}`);
    
    // Combine the results to enrich movie data
    const enrichedMovies = filteredProwlarrMovies.map(prowlarrMovie => {
      // Find matching TMDb movie (if TMDb data is available)
      const matchingTMDbMovie = tmdbMovies.find(tmdbMovie => 
        tmdbMovie.title.toLowerCase() === prowlarrMovie.title.toLowerCase() &&
        (!prowlarrMovie.year || !tmdbMovie.releaseDate || (prowlarrMovie.year && tmdbMovie.releaseDate && prowlarrMovie.year.toString() === tmdbMovie.releaseDate.substring(0,4)))
      );
      
      return {
        ...prowlarrMovie,
        tmdb: matchingTMDbMovie ? {
          id: matchingTMDbMovie.tmdbId,
          posterPath: matchingTMDbMovie.posterPath,
          backdropPath: matchingTMDbMovie.backdropPath,
          voteAverage: matchingTMDbMovie.voteAverage,
          genreIds: matchingTMDbMovie.genres?.map(g => g.id),
          overview: matchingTMDbMovie.overview,
        } : undefined,
        tmdbAvailable: hasTmdbData, // Flag to indicate if TMDb integration is available
      };
    });
    
    return NextResponse.json(enrichedMovies);
  } catch (error: unknown) {
    console.error('Error in /api/movies route:', error);
    let errorMessage = 'An error occurred while fetching movies';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
