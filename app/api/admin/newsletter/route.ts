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
    
    if (validatedParams.frequency !== 'all') {
      queryParams.frequency = validatedParams.frequency;
    }
    
    if (validatedParams.source !== 'all') {
      queryParams.source = validatedParams.source;
    }
    
    if (validatedParams.dateFrom) {
      queryParams.dateFrom = validatedParams.dateFrom;
    }
    
    if (validatedParams.dateTo) {
      queryParams.dateTo = validatedParams.dateTo;
    }
    
    const queryString = new URLSearchParams(queryParams).toString();
    
    const response = await fetch(`${backendUrl}/api/v1/newsletters?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Failed to fetch newsletter subscribers',
          details: errorData.error || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
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
