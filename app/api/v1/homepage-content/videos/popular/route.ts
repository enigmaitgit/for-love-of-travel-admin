import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// GET /api/v1/homepage-content/videos/popular - Get popular videos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/v1/homepage-content/videos/popular${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching popular videos from:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch popular videos',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching popular videos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch popular videos' },
      { status: 500 }
    );
  }
}

