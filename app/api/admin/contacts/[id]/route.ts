import { NextRequest, NextResponse } from 'next/server';
import { ContactUpdateSchema } from '@/lib/validation';
import { getSessionRole, can } from '@/lib/rbac';

// GET /api/admin/contacts/[id] - Get single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'contact:view')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    
    // Mock data for now - in production, this would fetch from the backend API
    const mockContact = {
      _id: resolvedParams.id,
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Travel inquiry',
      message: 'I am interested in your travel packages and would like to know more about your services. Could you please provide me with more information about your available destinations and pricing?',
      status: 'new' as const,
      priority: 'medium' as const,
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      metadata: {
        referrer: 'https://google.com',
        source: 'website',
        campaign: 'summer-travel',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_term: 'travel packages',
        utm_content: 'ad-1'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: mockContact
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/contacts/[id] - Update contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'contact:edit')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = ContactUpdateSchema.parse(body);

    // Mock implementation - in production, this would call the backend API
    const updatedContact = {
      _id: resolvedParams.id,
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Travel inquiry',
      message: 'I am interested in your travel packages...',
      status: validatedData.status || 'new',
      priority: validatedData.priority || 'medium',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      metadata: {
        referrer: 'https://google.com',
        source: 'website',
        campaign: 'summer-travel',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_term: 'travel packages',
        utm_content: 'ad-1'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Contact updated successfully',
      data: updatedContact
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    
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

// DELETE /api/admin/contacts/[id] - Delete contact
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'contact:delete')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await params;
    
    // Mock implementation - in production, this would call the backend API
    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
