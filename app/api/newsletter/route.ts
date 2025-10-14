import { NextRequest, NextResponse } from 'next/server';
import { NewsletterSubscriptionSchema } from '@/lib/validation';

// POST /api/newsletter - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    NewsletterSubscriptionSchema.parse(body);

    // Get client IP and user agent
    // const forwarded = request.headers.get('x-forwarded-for');
    // const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    // const userAgent = request.headers.get('user-agent') || 'unknown';

    // Mock implementation - in production, this would save to the backend API
    const newsletterId = Math.random().toString(36).substr(2, 9);

    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing to our newsletter!',
      data: { id: newsletterId }
    }, { status: 201 });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE /api/newsletter - Unsubscribe from newsletter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Mock implementation - in production, this would update the backend API
    return NextResponse.json({
      success: true,
      message: 'You have been successfully unsubscribed from our newsletter.'
    });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe. Please try again.' },
      { status: 500 }
    );
  }
}
