import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// GET /api/admin/categories - List categories with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Try to fetch from the admin backend first
    const queryString = searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/v1/categories${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching categories from:', backendUrl);
    
    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Backend response:', data);
        return NextResponse.json(data, { status: response.status });
      } else {
        console.log(`Backend returned ${response.status}, using fallback data`);
      }
    } catch (backendError) {
      console.log('Backend not available, using fallback data:', backendError);
    }

    // Try to fetch posts data to calculate real post counts
    let postsData = { rows: [] };
    try {
      const postsResponse = await fetch('http://localhost:5000/api/v1/admin/posts?limit=1000', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(3000)
      });
      
      if (postsResponse.ok) {
        postsData = await postsResponse.json();
      }
    } catch (postsError) {
      console.log('Could not fetch posts for category counts:', postsError);
    }

    // Fallback: Return mock category data when backend is not available
    const mockCategories = [
      {
        _id: '1',
        name: 'Destinations',
        slug: 'destinations',
        description: 'Explore amazing travel destinations around the world',
        postCount: 0, // Will be calculated from real data
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '2',
        name: 'Practical Travel',
        slug: 'practical-travel',
        description: 'Essential tips and advice for travelers',
        postCount: 0, // Will be calculated from real data
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '3',
        name: 'Asia',
        slug: 'asia',
        description: 'Travel destinations and experiences in Asia',
        postCount: 0, // Will be calculated from real data
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '4',
        name: 'Budget Travel',
        slug: 'budget-travel',
        description: 'Travel on a budget without compromising on experiences',
        postCount: 0, // Will be calculated from real data
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '5',
        name: 'Food & Culture',
        slug: 'food-culture',
        description: 'Discover local cuisines and cultural experiences',
        postCount: 0, // Will be calculated from real data
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '6',
        name: 'Adventure Travel',
        slug: 'adventure-travel',
        description: 'Thrilling adventures and outdoor activities',
        postCount: 0, // Will be calculated from real data
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Calculate actual post counts from posts data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts: any[] = postsData.rows || [];
    console.log('Posts data for category counting:', posts.map(p => ({ title: p.title, categories: p.categories })));
    
    const categoriesWithCounts = mockCategories.map(category => {
      // Count posts that have this category
      const postCount = posts.filter(post => {
        if (!post.categories || !Array.isArray(post.categories)) return false;
        
        // Check if any category matches by name or slug
        return post.categories.some((cat: string | { name?: string; slug?: string }) => {
          if (typeof cat === 'string') {
            return cat.toLowerCase() === category.name.toLowerCase() || 
                   cat.toLowerCase() === category.slug.toLowerCase();
          }
          if (typeof cat === 'object' && cat.name) {
            return cat.name.toLowerCase() === category.name.toLowerCase() || 
                   cat.slug?.toLowerCase() === category.slug.toLowerCase();
          }
          return false;
        });
      }).length;
      
      console.log(`Category "${category.name}" has ${postCount} posts`);
      
      return {
        ...category,
        postCount
      };
    });

    // Apply basic filtering if needed
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');

    let filteredCategories = categoriesWithCounts;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredCategories = filteredCategories.filter(category => 
        category.name.toLowerCase().includes(searchLower) ||
        category.description.toLowerCase().includes(searchLower) ||
        category.slug.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedCategories = filteredCategories.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedCategories,
      total: filteredCategories.length,
      page: page,
      limit: limit,
      count: paginatedCategories.length
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Creating category with data:', JSON.stringify(body, null, 2));
    
    const response = await fetch(`${BACKEND_URL}/api/v1/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error response:', errorData);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to create category',
          details: errorData.message || errorData.error || `Backend API error: ${response.status}`,
          backendError: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend success response:', data);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}




