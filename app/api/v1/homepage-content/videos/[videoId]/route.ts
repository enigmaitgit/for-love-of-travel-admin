import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// PUT /api/v1/homepage-content/videos/[videoId] - Update video
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const backendUrl = `${BACKEND_URL}/api/v1/homepage-content/videos/${videoId}`;
    
    console.log('Updating video at:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'PUT',
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
          error: 'Failed to update video',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update video' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/homepage-content/videos/[videoId] - Delete video
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const backendUrl = `${BACKEND_URL}/api/v1/homepage-content/videos/${videoId}`;
    
    console.log('Deleting video at:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
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
          error: 'Failed to delete video',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}

