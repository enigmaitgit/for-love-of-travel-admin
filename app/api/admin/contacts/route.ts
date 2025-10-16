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

    // Mock data for now - in production, this would fetch from the backend API
    const mockContacts = [
      {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Travel inquiry',
        message: 'I am interested in your travel packages...',
        status: 'new' as const,
        priority: 'medium' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        subject: 'Booking question',
        message: 'I have a question about my booking...',
        status: 'read' as const,
        priority: 'high' as const,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        _id: '3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        subject: 'Cancellation request',
        message: 'I need to cancel my trip...',
        status: 'replied' as const,
        priority: 'urgent' as const,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      }
    ];

    // Apply filters to mock data
    let filteredContacts = mockContacts;

    if (validatedParams.status !== 'all') {
      filteredContacts = filteredContacts.filter(contact => contact.status === validatedParams.status);
    }

    if (validatedParams.priority !== 'all') {
      filteredContacts = filteredContacts.filter(contact => contact.priority === validatedParams.priority);
    }

    if (validatedParams.search) {
      const searchLower = validatedParams.search.toLowerCase();
      filteredContacts = filteredContacts.filter(contact => 
        contact.name.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower) ||
        contact.subject.toLowerCase().includes(searchLower) ||
        contact.message.toLowerCase().includes(searchLower)
      );
    }

    const total = filteredContacts.length;
    const start = (validatedParams.page - 1) * validatedParams.limit;
    const end = start + validatedParams.limit;
    const rows = filteredContacts.slice(start, end);

    return NextResponse.json({
      success: true,
      data: {
        rows,
        total,
        page: validatedParams.page,
        limit: validatedParams.limit,
        pages: Math.ceil(total / validatedParams.limit)
      }
    });
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

    const { action: _, contactIds } = validatedData;

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
