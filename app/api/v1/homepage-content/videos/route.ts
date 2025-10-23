import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// POST /api/v1/homepage-content/videos - Add video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = `${BACKEND_URL}/api/v1/homepage-content/videos`;
    
    console.log('Adding video at:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to add video',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error adding video:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add video' },
      { status: 500 }
    );
  }
}

