import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/comments - List comments with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Try to fetch from the admin backend first
    const queryString = searchParams.toString();
    const backendUrl = `http://localhost:5000/api/v1/comments${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching comments from:', backendUrl);
    
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
        return NextResponse.json(data, { status: response.status });
      }
    } catch (backendError) {
      console.log('Backend not available, using fallback data:', backendError);
    }

    // Fallback: Return mock comment data when backend is not available
    const mockComments = [
      {
        _id: '1',
        content: 'Great insights on workplace technology trends!',
        author: {
          name: 'John Doe',
          email: 'john@example.com',
          avatar: '300-1.png'
        },
        postId: {
          _id: '1',
          title: 'The Impact of Technology on the Workplace',
          slug: 'impact-technology-workplace'
        },
        status: 'approved',
        rating: 5,
        likes: 12,
        dislikes: 2,
        reports: 0,
        replies: 3,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '2',
        content: 'I have some questions about the implementation...',
        author: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          avatar: '300-2.png'
        },
        postId: {
          _id: '1',
          title: 'The Impact of Technology on the Workplace',
          slug: 'impact-technology-workplace'
        },
        status: 'pending',
        rating: 4,
        likes: 8,
        dislikes: 1,
        reports: 0,
        replies: 1,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '3',
        content: 'This article really opened my eyes to new possibilities.',
        author: {
          name: 'Mike Johnson',
          email: 'mike@example.com',
          avatar: '300-3.png'
        },
        postId: {
          _id: '2',
          title: 'Travel Tips for Digital Nomads',
          slug: 'travel-tips-digital-nomads'
        },
        status: 'approved',
        rating: 5,
        likes: 15,
        dislikes: 3,
        reports: 0,
        replies: 5,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '4',
        content: 'I disagree with some of the points made here.',
        author: {
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          avatar: '300-4.png'
        },
        postId: {
          _id: '2',
          title: 'Travel Tips for Digital Nomads',
          slug: 'travel-tips-digital-nomads'
        },
        status: 'spam',
        rating: 3,
        likes: 2,
        dislikes: 8,
        reports: 3,
        replies: 0,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '5',
        content: 'Excellent research and well-written article!',
        author: {
          name: 'David Brown',
          email: 'david@example.com',
          avatar: '300-5.png'
        },
        postId: {
          _id: '3',
          title: 'Budget Travel Hacks',
          slug: 'budget-travel-hacks'
        },
        status: 'approved',
        rating: 5,
        likes: 20,
        dislikes: 1,
        reports: 0,
        replies: 2,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Apply basic filtering if needed
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let filteredComments = mockComments;

    if (status && status !== 'all') {
      filteredComments = filteredComments.filter(comment => comment.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredComments = filteredComments.filter(comment => 
        comment.content.toLowerCase().includes(searchLower) ||
        comment.author.name.toLowerCase().includes(searchLower) ||
        comment.postId.title.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedComments = filteredComments.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedComments,
      total: filteredComments.length,
      page: page,
      limit: limit,
      count: paginatedComments.length
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
