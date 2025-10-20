import { NextRequest, NextResponse } from 'next/server';
import { NewsletterUpdateSchema } from '@/lib/validation';
import { getSessionRole, can } from '@/lib/rbac';

// GET /api/admin/newsletter/[email] - Get single subscriber
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'newsletter:view')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/v1/newsletters/${resolvedParams.email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Failed to fetch newsletter subscriber',
          details: errorData.error || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching subscriber:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/newsletter/[email] - Update subscriber
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'newsletter:edit')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = NewsletterUpdateSchema.parse(body);

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/v1/newsletters/${resolvedParams.email}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Failed to update newsletter subscriber',
          details: errorData.error || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating subscriber:', error);
    
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

// DELETE /api/admin/newsletter/[email] - Delete subscriber
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'newsletter:delete')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await params;
    
    // Mock implementation - in production, this would call the backend API
    return NextResponse.json({
      success: true,
      message: 'Subscriber deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
