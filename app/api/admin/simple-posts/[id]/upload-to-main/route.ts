import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.ADMIN_BACKEND_URL || 'http://localhost:5000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/v1/simple-posts/${id}/upload-to-main`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || 'Failed to upload simple post to main website',
          validationErrors: errorData.errors || [],
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading simple post to main website:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


