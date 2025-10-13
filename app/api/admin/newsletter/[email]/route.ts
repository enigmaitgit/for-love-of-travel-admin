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
    
    // Mock data for now - in production, this would fetch from the backend API
    const mockSubscriber = {
      _id: '1',
      email: resolvedParams.email,
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
      notes: 'Interested in European destinations',
      metadata: {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        referrer: 'https://google.com',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'newsletter-signup',
        utm_term: 'travel newsletter',
        utm_content: 'popup-1'
      }
    };

    return NextResponse.json({
      success: true,
      data: mockSubscriber
    });
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

    // Mock implementation - in production, this would call the backend API
    const updatedSubscriber = {
      _id: '1',
      email: resolvedParams.email,
      status: validatedData.status || 'active',
      source: 'website' as const,
      preferences: {
        frequency: validatedData.preferences?.frequency || 'monthly',
        categories: validatedData.preferences?.categories || ['travel-tips', 'destinations'],
        language: validatedData.preferences?.language || 'en'
      },
      subscribedAt: new Date().toISOString(),
      emailCount: 12,
      bounceCount: 0,
      complaintCount: 0,
      tags: validatedData.tags || ['vip', 'traveler'],
      notes: validatedData.notes || 'Interested in European destinations',
      metadata: {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        referrer: 'https://google.com',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'newsletter-signup',
        utm_term: 'travel newsletter',
        utm_content: 'popup-1'
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Subscriber updated successfully',
      data: updatedSubscriber
    });
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
