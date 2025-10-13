import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/posts - List posts with filters (TEST VERSION)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Forward the request to the admin backend
    const queryString = searchParams.toString();
    const backendUrl = `http://localhost:5000/api/v1/admin/posts${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch posts',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

