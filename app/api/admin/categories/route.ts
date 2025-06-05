import { NextRequest, NextResponse } from 'next/server';
import { CategoryConfigService } from '@/lib/services/server/category-config-service';

export async function GET() {
  try {
    const categories = await CategoryConfigService.getAllCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await CategoryConfigService.upsertCategory(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save category' }, { status: 500 });
  }
}
