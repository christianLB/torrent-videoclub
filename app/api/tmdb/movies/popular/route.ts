// app/api/tmdb/movies/popular/route.ts
import { NextResponse } from 'next/server';
import { tmdbDataService } from '@/lib/services/tmdb-data-service';
import { TMDBMediaItem } from '@/lib/types/tmdb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('page');
  let page = 1;

  if (pageParam) {
    const parsedPage = parseInt(pageParam, 10);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      page = parsedPage;
    }
  }

  try {
    console.log(`[API TMDB Popular Movies] Fetching page ${page}`);
    const items = await tmdbDataService.getOrFetchPopularMovies(page);

    if (!items || items.length === 0) {
      // Depending on requirements, might return 404 or empty array for an empty page
      // For now, returning empty array if service itself doesn't error
      return NextResponse.json<TMDBMediaItem[]>([]);
    }

    return NextResponse.json<TMDBMediaItem[]>(items);
  } catch (error) {
    console.error(`[API TMDB Popular Movies] Error fetching page ${page}:`, error);
    if (error instanceof Error && error.message.includes('TMDB_API_KEY is not set')) {
        return NextResponse.json(
            { error: 'TMDB API key is not configured on the server.' }, 
            { status: 503 } // Service Unavailable
        );
    }
    return NextResponse.json(
      { error: 'Internal server error while fetching popular movies.' },
      { status: 500 }
    );
  }
}
