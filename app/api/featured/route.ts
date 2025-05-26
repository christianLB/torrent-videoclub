/**
 * API route for featured content
 */
import { NextResponse } from 'next/server';
import { CuratorService } from '../../../lib/services/curator-service';

/**
 * GET handler for /api/featured
 * Returns featured content for the homepage
 */
export async function GET(request: Request) {
  try {
    console.log('Fetching featured content...');
    
    // Get featured content from the curator service
    const featuredContent = await CuratorService.getFeaturedContent();
    
    // Simply return the featured content as JSON
    // NextResponse.json will handle the serialization
    return NextResponse.json(featuredContent, { status: 200 });
  } catch (error) {
    console.error('Error in /api/featured route:', error);
    
    // Return error response
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
