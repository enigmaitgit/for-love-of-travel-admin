import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// GET /api/v1/homepage-content/videos/analytics - Get video analytics
export async function GET(_request: NextRequest) {
  try {
    const backendUrl = `${BACKEND_URL}/api/v1/homepage-content/videos/analytics`;
    
    console.log('Fetching video analytics from:', backendUrl);
    
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
          error: 'Failed to fetch video analytics',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching video analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch video analytics' },
      { status: 500 }
    );
  }
}
