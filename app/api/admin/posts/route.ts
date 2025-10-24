import { NextRequest, NextResponse } from 'next/server';

// Author type for backend responses
type AuthorResponse = {
  fullname?: string;
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

  // Try fullname first (from our backend), then firstName/lastName, then email
  if (author.fullname) {
    return author.fullname;
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
    
    // Try to fetch from the admin backend first
    const queryString = searchParams.toString();
    const backendUrl = `http://localhost:5000/api/v1/admin/posts${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching posts from:', backendUrl);
    
    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
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
      }
    } catch (backendError) {
      console.log('Backend not available, using fallback data:', backendError);
    }

    // Fallback: Return mock post data when backend is not available
    const mockPosts = [
      {
        _id: '1',
        id: '1',
        title: 'This is to check the publishing',
        slug: 'this-is-to-check-the-publishing',
        body: 'This is a test post to check the publishing functionality...',
        status: 'published',
        author: 'John Smith',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        featuredImage: '/media/posts/test-post-1.jpg',
        readingTime: 5,
        tags: ['test', 'publishing', 'check'],
        categories: ['Destinations', 'Practical Travel']
      },
      {
        _id: '2',
        id: '2',
        title: 'This is to check',
        slug: 'this-is-to-check',
        body: 'This is another test post to check the functionality...',
        status: 'published',
        author: 'Sarah Johnson',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        featuredImage: '/media/posts/test-post-2.jpg',
        readingTime: 7,
        tags: ['test', 'check', 'functionality'],
        categories: ['Destinations', 'Asia']
      },
      {
        _id: '3',
        id: '3',
        title: 'Digital Marketing Trends 2024',
        slug: 'digital-marketing-trends-2024',
        body: 'Discover the latest trends in digital marketing for 2024...',
        status: 'review',
        author: 'Mike Chen',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        featuredImage: '/media/posts/digital-marketing.jpg',
        readingTime: 6,
        tags: ['marketing', 'digital', 'trends'],
        categories: ['Marketing', 'Business']
      },
      {
        _id: '4',
        id: '4',
        title: 'Healthy Lifestyle Habits',
        slug: 'healthy-lifestyle-habits',
        body: 'Simple habits that can transform your health and wellbeing...',
        status: 'draft',
        author: 'Emily Davis',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        featuredImage: '/media/posts/healthy-lifestyle.jpg',
        readingTime: 8,
        tags: ['health', 'lifestyle', 'wellness'],
        categories: ['Health', 'Lifestyle']
      }
    ];

    // Apply basic filtering if needed
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let filteredPosts = mockPosts;

    if (status && status !== 'all') {
      if (status.includes(',')) {
        const statusArray = status.split(',').map(s => s.trim());
        filteredPosts = filteredPosts.filter(post => statusArray.includes(post.status));
      } else {
        filteredPosts = filteredPosts.filter(post => post.status === status);
      }
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.body.toLowerCase().includes(searchLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      rows: paginatedPosts,
      total: filteredPosts.length,
      page: page,
      limit: limit,
      count: paginatedPosts.length
    });

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
