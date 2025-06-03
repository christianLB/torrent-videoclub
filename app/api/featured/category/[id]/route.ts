/**
 * API route for retrieving category data
 * 
 * This API route is designed to be called from the client-side for fetching specific categories,
 * preventing direct client-side imports of server-side cache-dependent code.
 */
import { NextRequest, NextResponse } from 'next/server';
import { CuratorService } from '@/lib/services/curator-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // In Next.js 15, params is a Promise that must be awaited
    const { id: categoryId } = await context.params;
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

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
    console.error(`[API] Error fetching category:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch category data',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
