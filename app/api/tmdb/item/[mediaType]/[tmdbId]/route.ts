// app/api/tmdb/item/[mediaType]/[tmdbId]/route.ts
import { NextResponse } from 'next/server';
import { tmdbDataService } from '@/lib/services/tmdb-data-service';
import { TMDBMediaItem } from '@/lib/types/tmdb';

interface Params {
  mediaType: string;
  tmdbId: string;
}

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  const { mediaType, tmdbId: tmdbIdStr } = params;

  if (mediaType !== 'movie' && mediaType !== 'tv') {
    return NextResponse.json(
      { error: 'Invalid media type. Must be "movie" or "tv".' },
      { status: 400 }
    );
  }

  const tmdbId = parseInt(tmdbIdStr, 10);
  if (isNaN(tmdbId)) {
    return NextResponse.json(
      { error: 'Invalid TMDB ID. Must be a number.' },
      { status: 400 }
    );
  }

  try {
    console.log(`[API TMDB Item] Fetching ${mediaType} with ID ${tmdbId}`);
    const item = await tmdbDataService.getOrFetchMediaItem(tmdbId, mediaType as 'movie' | 'tv');

    if (!item) {
      return NextResponse.json(
        { error: `${mediaType} with ID ${tmdbId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json<TMDBMediaItem>(item);
  } catch (error) {
    console.error(`[API TMDB Item] Error fetching ${mediaType} ID ${tmdbId}:`, error);
    // Check if the error is due to TMDB_API_KEY missing (from TMDBDataService constructor)
    if (error instanceof Error && error.message.includes('TMDB_API_KEY is not set')) {
        return NextResponse.json(
            { error: 'TMDB API key is not configured on the server.' }, 
            { status: 503 } // Service Unavailable
        );
    }
    return NextResponse.json(
      { error: 'Internal server error while fetching TMDB item.' },
      { status: 500 }
    );
  }
}
