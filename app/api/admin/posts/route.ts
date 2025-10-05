import { NextRequest, NextResponse } from 'next/server';
import { PostDraftSchema, PostSearchSchema } from '@/lib/validation';
import { getSessionRole, can } from '@/lib/rbac';

// POST /api/admin/posts - Create new post
export async function POST(request: NextRequest) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'post:create')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = PostDraftSchema.parse(body);

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Failed to create post',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data.data || data, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/posts - List posts with filters
export async function GET(request: NextRequest) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'post:create')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || 'all';
    const author = searchParams.get('author') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const searchParams_ = {
      search,
      status: status as 'all' | 'draft' | 'review' | 'scheduled' | 'published',
      author,
      dateFrom,
      dateTo,
      page,
      limit,
    };

    const validatedParams = PostSearchSchema.parse(searchParams_);
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const queryString = new URLSearchParams({
      search: validatedParams.search || '',
      status: validatedParams.status,
      author: validatedParams.author || '',
      dateFrom: validatedParams.dateFrom || '',
      dateTo: validatedParams.dateTo || '',
      page: validatedParams.page.toString(),
      limit: validatedParams.limit.toString(),
    }).toString();
    
    const response = await fetch(`${backendUrl}/api/admin/posts?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Failed to fetch posts',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    console.log('📋 Backend posts response:', {
      success: data.success,
      rows: data.rows?.length || 0,
      total: data.total,
      page: data.page,
      limit: data.limit,
      firstPost: data.rows?.[0] ? {
        _id: data.rows[0]._id,
        id: data.rows[0].id,
        title: data.rows[0].title,
        hasId: !!data.rows[0]._id || !!data.rows[0].id
      } : null
    });
    
    // Transform the backend response to match frontend expectations
    const { transformBackendPost } = await import('@/lib/api-client');
    const transformedRows = (data.rows || data.data || []).map(transformBackendPost);
    
    const result = {
      rows: transformedRows,
      total: data.total || 0,
      page: data.page || validatedParams.page,
      pages: data.pages || Math.ceil((data.total || 0) / validatedParams.limit),
      count: data.count || transformedRows.length
    };
    
    console.log('📋 Transformed result:', {
      rows: result.rows.length,
      total: result.total,
      page: result.page,
      pages: result.pages,
      count: result.count
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching posts:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
