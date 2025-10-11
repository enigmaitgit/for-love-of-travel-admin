import { NextRequest, NextResponse } from 'next/server';
import { getSessionRole, can } from '@/lib/rbac';

// GET /api/admin/users - List users with filters
export async function GET(request: NextRequest) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'user:view')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const roleFilter = searchParams.get('role') || 'all';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    // Build query parameters - only include non-empty values
    const queryParams: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };
    
    if (search) {
      queryParams.search = search;
    }
    
    if (roleFilter !== 'all') {
      queryParams.role = roleFilter;
    }
    
    // Only add status if it's not 'all' and not empty
    if (status !== 'all' && status) {
      queryParams.status = status;
    }
    
    const queryString = new URLSearchParams(queryParams).toString();
    
    const response = await fetch(`${backendUrl}/api/v1/users?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Failed to fetch users',
          details: errorData.error || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
