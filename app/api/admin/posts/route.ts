import { NextRequest, NextResponse } from 'next/server';

// Author type for backend responses
type AuthorResponse = {
  firstName?: string;
  lastName?: string;
  email?: string;
  _id?: string;
};

// Helper function to transform author from backend response
function transformAuthor(author: string | AuthorResponse | null): string {
  if (typeof author === 'string') {
    return author;
  }

  if (!author) {
    return 'Unknown Author';
  }

  const firstName = author.firstName || '';
  const lastName = author.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || author.email || 'Unknown';
}

// GET /api/admin/posts - List posts with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Forward the request to the admin backend
    const queryString = searchParams.toString();
    const backendUrl = `http://localhost:5000/api/v1/admin/posts${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching posts from:', backendUrl);
    
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
          error: 'Failed to fetch posts',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend response:', data);
    
    // Transform the posts to ensure author is a string and id field exists
    if (data.rows && Array.isArray(data.rows)) {
      data.rows = data.rows.map((post: {
        _id: string;
        id?: string;
        author: string | AuthorResponse;
        [key: string]: unknown;
      }) => ({
        ...post,
        id: post._id || post.id, // Ensure id field exists
        author: transformAuthor(post.author)
      }));
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/posts - Create new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const backendUrl = `http://localhost:5000/api/v1/admin/posts`;
    
    const response = await fetch(backendUrl, {
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
          error: 'Failed to create post',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
