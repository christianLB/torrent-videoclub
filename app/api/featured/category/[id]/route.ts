/**
 * API route for retrieving category data
 * 
 * This endpoint serves as a server-side interface to the CuratorService,
 * preventing direct client-side imports of Redis-dependent code.
 */
import { NextRequest, NextResponse } from 'next/server';
import { CuratorService } from '@/lib/services/curator-service';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // Correctly extract and await params in Next.js 14+
  const { params } = context;
  const categoryId = params?.id;

  if (!categoryId) {
    return NextResponse.json(
      { error: 'Category ID is required' },
      { status: 400 }
    );
  }

  try {
    console.log(`[API] Fetching category: ${categoryId}`);
    const categoryData = await CuratorService.getCategory(categoryId);
    
    if (!categoryData) {
      return NextResponse.json(
        { error: `Category '${categoryId}' not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(categoryData);
  } catch (error) {
    console.error(`[API] Error fetching category ${categoryId}:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch category data',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
