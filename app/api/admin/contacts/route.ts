import { NextRequest, NextResponse } from 'next/server';
import { ContactSearchSchema, ContactBulkActionSchema } from '@/lib/validation';
import { getSessionRole, can } from '@/lib/rbac';

// GET /api/admin/contacts - List contacts with filters
export async function GET(request: NextRequest) {
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
    
    // Build query parameters - only include non-empty values
    const queryParams: Record<string, string> = {
      page: validatedParams.page.toString(),
      limit: validatedParams.limit.toString(),
    };
    
    if (validatedParams.search) {
      queryParams.search = validatedParams.search;
    }
    
    if (validatedParams.status !== 'all') {
      queryParams.status = validatedParams.status;
    }
    
    if (validatedParams.priority !== 'all') {
      queryParams.priority = validatedParams.priority;
    }
    
    if (validatedParams.dateFrom) {
      queryParams.dateFrom = validatedParams.dateFrom;
    }
    
    if (validatedParams.dateTo) {
      queryParams.dateTo = validatedParams.dateTo;
    }
    
    const queryString = new URLSearchParams(queryParams).toString();
    
    const response = await fetch(`${backendUrl}/api/v1/contacts?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Failed to fetch contacts',
          details: errorData.error || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    
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

    const { contactIds } = validatedData;

    // Mock implementation - in production, this would call the backend API
    const success = contactIds.length;
    const failed = 0;

    return NextResponse.json({
      success: true,
      message: `Bulk operation completed. ${success} successful, ${failed} failed.`,
      data: { success, failed }
    });
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
