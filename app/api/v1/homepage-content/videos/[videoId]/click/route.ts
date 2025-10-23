import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// POST /api/v1/homepage-content/videos/[videoId]/click - Track video click
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const backendUrl = `${BACKEND_URL}/api/v1/homepage-content/videos/${videoId}/click`;
    
    console.log('Tracking video click at:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
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
          error: 'Failed to track video click',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error tracking video click:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track video click' },
      { status: 500 }
    );
  }
}

