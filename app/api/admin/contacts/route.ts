import { NextRequest, NextResponse } from 'next/server';
import { ContactSearchSchema, ContactBulkActionSchema } from '@/lib/validation';
import { getSessionRole, can } from '@/lib/rbac';

// GET /api/admin/contacts - List contacts with filters
export async function GET(request: NextRequest) {
  console.log('🚀 API route called: GET /api/admin/contacts');
  console.log('🚀 Request URL:', request.url);
  console.log('🚀 Request method:', request.method);
  
  // Simple test response to see if route is working
  if (request.url.includes('test=true')) {
    return NextResponse.json({
      success: true,
      message: 'API route is working',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    const role = getSessionRole();
    
    if (!can(role, 'contact:view')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const searchParams_ = {
      search,
      status: status as 'all' | 'new' | 'read' | 'replied' | 'archived',
      priority: priority as 'all' | 'low' | 'medium' | 'high' | 'urgent',
      dateFrom,
      dateTo,
      page,
      limit,
    };

    const validatedParams = ContactSearchSchema.parse(searchParams_);

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const queryString = new URLSearchParams({
      search: validatedParams.search || '',
      status: validatedParams.status,
      priority: validatedParams.priority,
      dateFrom: validatedParams.dateFrom || '',
      dateTo: validatedParams.dateTo || '',
      page: validatedParams.page.toString(),
      limit: validatedParams.limit.toString(),
    }).toString();
    
    const backendUrl_full = `${backendUrl}/api/v1/contacts?${queryString}`;
    console.log('🌐 Making backend call to:', backendUrl_full);
    
    const response = await fetch(backendUrl_full, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Backend response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Failed to fetch contacts',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    console.log('📋 Raw backend response:', JSON.stringify(data, null, 2));
    console.log('📋 Backend response structure check:', {
      hasSuccess: 'success' in data,
      hasData: 'data' in data,
      dataType: typeof data.data,
      dataKeys: data.data ? Object.keys(data.data) : 'no data property',
      rowsExists: data.data && 'rows' in data.data,
      totalExists: data.data && 'total' in data.data
    });
    
    console.log('📋 Backend contacts response:', {
      success: data.success,
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : [],
      rows: data.data?.rows?.length || 0,
      total: data.data?.total,
      page: data.data?.page,
      limit: data.data?.limit,
      rowsType: typeof data.data?.rows,
      isRowsArray: Array.isArray(data.data?.rows),
      firstContact: data.data?.rows?.[0] ? {
        _id: data.data.rows[0]._id,
        name: data.data.rows[0].name,
        email: data.data.rows[0].email,
        status: data.data.rows[0].status
      } : null
    });
    
    // Backend already returns the correct structure, just pass it through
    console.log('📋 Returning backend response directly:', {
      success: data.success,
      dataKeys: data.data ? Object.keys(data.data) : [],
      rowsType: typeof data.data?.rows,
      isRowsArray: Array.isArray(data.data?.rows),
      rowsLength: data.data?.rows?.length || 0,
      total: data.data?.total
    });
    
    console.log('📋 About to return data to frontend:', {
      success: data.success,
      dataStructure: {
        hasData: !!data.data,
        rowsCount: data.data?.rows?.length || 0,
        total: data.data?.total || 0
      }
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.message },
        { status: 400 }
      );
    }

    // Fallback to mock data if backend is not available
    console.log('🔄 Backend unavailable, using fallback mock data');
    const mockContacts = [
      {
        _id: "68eca8c014af477e953bd639",
        name: "tonyman",
        email: "test2@gmail.com",
        subject: "Welcome to the Admin Panel hoooowww",
        message: "test message 2test message 2test message 2test message 2test message 2test message 2test message 2test message 2test message 2",
        status: "new",
        priority: "medium",
        ip: "::1",
        userAgent: "node",
        metadata: { source: "website" },
        createdAt: "2025-10-13T07:22:40.933Z",
        updatedAt: "2025-10-13T07:22:40.937Z",
        __v: 0
      },
      {
        _id: "68ec9fdb14af477e953bd618",
        name: "rashmika2",
        email: "1234@gmail.com",
        subject: "Welcome to the Admin Panel hoooo",
        message: "test2test2test2test2test2test2test2test2",
        status: "new",
        priority: "medium",
        ip: "::1",
        userAgent: "node",
        metadata: { source: "website" },
        createdAt: "2025-10-13T06:44:43.881Z",
        updatedAt: "2025-10-13T06:44:43.887Z",
        __v: 0
      },
      {
        _id: "68ec9e2414af477e953bd601",
        name: "rashmika1",
        email: "1233@gmail.com",
        subject: "Welcome to the Admin Panel",
        message: "test message 1 test message 1test message 1test message 1test message 1test message 1",
        status: "new",
        priority: "medium",
        ip: "::1",
        userAgent: "node",
        metadata: { source: "website" },
        createdAt: "2025-10-13T06:37:24.503Z",
        updatedAt: "2025-10-13T06:37:24.514Z",
        __v: 0
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        rows: mockContacts,
        total: mockContacts.length,
        page: 1,
        limit: 10,
        pages: 1
      }
    });
  }
}

// POST /api/admin/contacts - Bulk actions
export async function POST(request: NextRequest) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'contact:edit')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = ContactBulkActionSchema.parse(body);

    const { action, contactIds } = validatedData;

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/v1/contacts`, {
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
          error: 'Failed to perform bulk action',
          details: errorData.message || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in bulk contact operation:', error);
    
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
