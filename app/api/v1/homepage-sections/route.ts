import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// GET /api/v1/homepage-sections - Get homepage sections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/v1/homepage-sections${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching homepage sections from:', backendUrl);
    
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
          error: 'Failed to fetch homepage sections',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch homepage sections' },
      { status: 500 }
    );
  }
}

// POST /api/v1/homepage-sections - Create homepage section
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = `${BACKEND_URL}/api/v1/homepage-sections`;
    
    console.log('Creating homepage section at:', backendUrl);
    
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
          error: 'Failed to create homepage section',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating homepage section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create homepage section' },
      { status: 500 }
    );
  }
}

