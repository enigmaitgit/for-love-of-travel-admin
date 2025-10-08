import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePostCount = searchParams.get('includePostCount') === 'true';
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    
    // For now, return mock data since backend is not available
    const mockCategories = [
      {
        _id: '1',
        name: 'Travel',
        slug: 'travel',
        description: 'Travel-related posts',
        postCount: includePostCount ? 15 : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        name: 'Destinations',
        slug: 'destinations',
        description: 'Destination guides and reviews',
        postCount: includePostCount ? 8 : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '3',
        name: 'Tips',
        slug: 'tips',
        description: 'Travel tips and advice',
        postCount: includePostCount ? 12 : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    
    // For now, return mock response since backend is not available
    const newCategory = {
      _id: Date.now().toString(),
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: description?.trim() || '',
      postCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
