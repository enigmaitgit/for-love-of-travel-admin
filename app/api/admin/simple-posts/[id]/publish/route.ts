import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.ADMIN_BACKEND_URL || 'http://localhost:5000';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Update the post status to published
    const publishData = {
      ...body,
      status: 'published'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/v1/simple-posts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(publishData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || errorData.error || 'Failed to publish simple post',
          validationErrors: errorData.errors || errorData.validationErrors || [],
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error publishing simple post:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
