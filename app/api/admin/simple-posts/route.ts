import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.ADMIN_BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const response = await fetch(`${API_BASE_URL}/api/v1/simple-posts?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: { message?: string } = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || 'Failed to fetch simple posts',
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching simple posts:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/v1/simple-posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Robust error parsing - don't lose server errors
      const ct = response.headers.get('content-type') || '';
      const raw = await response.text();
      let errorData: { message?: string; errors?: unknown[] } = {};
      try {
        if (ct.includes('application/json')) {
          errorData = JSON.parse(raw);
        } else {
          errorData = { message: raw || `${response.status} ${response.statusText}` };
        }
      } catch {
        errorData = { message: raw || `${response.status} ${response.statusText}` };
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || 'Failed to create simple post',
          validationErrors: errorData.errors || [],
          status: response.status,
          rawError: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating simple post:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

