import { NextRequest, NextResponse } from 'next/server';
import { TMDbClient } from '@/lib/api/tmdb-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // In Next.js 15, params is a Promise that must be awaited
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid movie ID. Must be a number.' },
        { status: 400 }
      );
    }
    
    const tmdbClient = new TMDbClient(process.env.TMDB_API_KEY || '');
    const movieDetails = await tmdbClient.getMovieDetails(id);
    
    return NextResponse.json(movieDetails);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    );
  }
}
