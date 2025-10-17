import { NextRequest, NextResponse } from 'next/server';
import { NewsletterSearchSchema, NewsletterBulkActionSchema } from '@/lib/validation';
import { getSessionRole, can } from '@/lib/rbac';

// GET /api/admin/newsletter - List newsletter subscribers with filters
export async function GET(request: NextRequest) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'newsletter:view')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || 'all';
    const frequency = searchParams.get('frequency') || 'all';
    const source = searchParams.get('source') || 'all';
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const searchParams_ = {
      search,
      status: status as 'all' | 'active' | 'unsubscribed' | 'bounced' | 'complained',
      frequency: frequency as 'all' | 'weekly' | 'monthly' | 'quarterly',
      source: source as 'all' | 'website' | 'popup' | 'footer' | 'admin' | 'import',
      dateFrom,
      dateTo,
      page,
      limit,
    };

    const validatedParams = NewsletterSearchSchema.parse(searchParams_);

    // Mock data for now - in production, this would fetch from the backend API
    const mockSubscribers = [
      {
        _id: '1',
        email: 'user1@example.com',
        status: 'active' as const,
        source: 'website' as const,
        preferences: {
          frequency: 'monthly' as const,
          categories: ['travel-tips', 'destinations'],
          language: 'en'
        },
        subscribedAt: new Date().toISOString(),
        emailCount: 12,
        bounceCount: 0,
        complaintCount: 0,
        tags: ['vip', 'traveler'],
        notes: 'Interested in European destinations'
      },
      {
        _id: '2',
        email: 'user2@example.com',
        status: 'active' as const,
        source: 'popup' as const,
        preferences: {
          frequency: 'weekly' as const,
          categories: ['deals'],
          language: 'en'
        },
        subscribedAt: new Date(Date.now() - 86400000).toISOString(),
        emailCount: 8,
        bounceCount: 1,
        complaintCount: 0,
        tags: ['deals-seeker'],
        notes: 'Likes discount offers'
      },
      {
        _id: '3',
        email: 'user3@example.com',
        status: 'unsubscribed' as const,
        source: 'footer' as const,
        preferences: {
          frequency: 'monthly' as const,
          categories: ['news'],
          language: 'en'
        },
        subscribedAt: new Date(Date.now() - 172800000).toISOString(),
        unsubscribedAt: new Date(Date.now() - 86400000).toISOString(),
        emailCount: 5,
        bounceCount: 0,
        complaintCount: 0,
        tags: [],
        notes: 'Unsubscribed due to frequency'
      }
    ];

    // Apply filters to mock data
    let filteredSubscribers = mockSubscribers;

    if (validatedParams.status !== 'all') {
      filteredSubscribers = filteredSubscribers.filter(sub => sub.status === validatedParams.status);
    }

    if (validatedParams.frequency !== 'all') {
      filteredSubscribers = filteredSubscribers.filter(sub => sub.preferences.frequency === validatedParams.frequency);
    }

    if (validatedParams.source !== 'all') {
      filteredSubscribers = filteredSubscribers.filter(sub => sub.source === validatedParams.source);
    }

    if (validatedParams.search) {
      const searchLower = validatedParams.search.toLowerCase();
      filteredSubscribers = filteredSubscribers.filter(sub => 
        sub.email.toLowerCase().includes(searchLower) ||
        sub.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (sub.notes && sub.notes.toLowerCase().includes(searchLower))
      );
    }

    const total = filteredSubscribers.length;
    const start = (validatedParams.page - 1) * validatedParams.limit;
    const end = start + validatedParams.limit;
    const rows = filteredSubscribers.slice(start, end);

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
    console.error('Error fetching newsletter subscribers:', error);
    
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

// POST /api/admin/newsletter - Bulk actions
export async function POST(request: NextRequest) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'newsletter:edit')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = NewsletterBulkActionSchema.parse(body);

    const { newsletterIds } = validatedData;

    // Mock implementation - in production, this would call the backend API
    const success = newsletterIds.length;
    const failed = 0;

    return NextResponse.json({
      success: true,
      message: `Bulk operation completed. ${success} successful, ${failed} failed.`,
      data: { success, failed }
    });
  } catch (error) {
    console.error('Error in bulk newsletter operation:', error);
    
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
