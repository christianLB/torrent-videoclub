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
    
    // Get series from Prowlarr
    const prowlarrSeries = await prowlarrClient.searchSeries(query);
    
    // Filter series by year if provided
    const filteredProwlarrSeries = yearFilter 
      ? prowlarrSeries.filter(series => series.year === yearFilter)
      : prowlarrSeries;
    
    // Get series metadata from TMDb
    const tmdbSeries = await tmdbClient.searchTvShows(query);
    
    // Combine the results to enrich series data
    const enrichedSeries = filteredProwlarrSeries.map(prowlarrSeries => {
      // Find matching TMDb series
      const matchingTMDbSeries = tmdbSeries.find(tmdbSeries => 
        tmdbSeries.title.toLowerCase() === prowlarrSeries.title.toLowerCase() &&
        (!prowlarrSeries.year || !tmdbSeries.year || prowlarrSeries.year === tmdbSeries.year)
      );
      
      return {
        ...prowlarrSeries,
        tmdb: matchingTMDbSeries ? {
          id: matchingTMDbSeries.id,
          posterPath: matchingTMDbSeries.posterPath,
          backdropPath: matchingTMDbSeries.backdropPath,
          voteAverage: matchingTMDbSeries.voteAverage,
          genreIds: matchingTMDbSeries.genreIds,
          overview: matchingTMDbSeries.overview,
        } : undefined,
      };
    });
    
    return NextResponse.json(enrichedSeries);
  } catch (error: any) {
    console.error('Error in /api/series route:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching series' },
      { status: 500 }
    );
  }
}
