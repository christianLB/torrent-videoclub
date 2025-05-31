import { redisService } from '@/lib/services/server/redis-service';
import { FeaturedContent } from '@/lib/types/featured';
import { NextResponse } from 'next/server';
// Adjust the path to redis-service.ts based on its actual location
// It was found at 'c:/dev/torrent-videoclub/lib/services/server/redis-service.ts'


export async function GET() {
  try {
    const featuredContent = await redisService.get<FeaturedContent>('featured:content');

    if (!featuredContent) {
      return NextResponse.json({ message: 'No featured content found in cache.' }, { status: 404 });
    }

    return NextResponse.json(featuredContent);
  } catch (error: unknown) {
    console.error('[API /api/admin/cache/featured] Error fetching cached content:', error);
    let message = 'An error occurred while fetching cached content.';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json(
      { error: message }, 
      { status: 500 }
    );
  }
}