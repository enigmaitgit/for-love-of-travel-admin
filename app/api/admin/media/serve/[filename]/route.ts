import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    // Forward the request to the backend media serve endpoint
    const response = await fetch(`${backendUrl}/api/v1/media/serve/${filename}`, {
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: response.status }
      );
    }

    // Get the content type from the backend response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Get the file data
    const fileData = await response.arrayBuffer();
    
    // Return the file with proper headers
    return new NextResponse(fileData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error serving media:', error);
    return NextResponse.json(
      { error: 'Failed to serve media' },
      { status: 500 }
    );
  }
}

