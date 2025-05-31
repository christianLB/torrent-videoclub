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
        { error: 'Invalid series ID. Must be a number.' },
        { status: 400 }
      );
    }
    
    const tmdbClient = new TMDbClient(process.env.TMDB_API_KEY || '');
    const seriesDetails = await tmdbClient.getTvShowDetails(id);
    
    return NextResponse.json(seriesDetails);
  } catch (error) {
    console.error('Error fetching series details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch series details' },
      { status: 500 }
    );
  }
}
