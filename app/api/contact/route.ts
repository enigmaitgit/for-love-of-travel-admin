import { NextRequest, NextResponse } from 'next/server';
import { ContactFormSchema } from '@/lib/validation';

// POST /api/contact - Submit contact form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    ContactFormSchema.parse(body);

    // Get client IP and user agent (for future use)
    // const forwarded = request.headers.get('x-forwarded-for');
    // const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    // const userAgent = request.headers.get('user-agent') || 'unknown';

    // Mock implementation - in production, this would save to the backend API
    const contactId = Math.random().toString(36).substr(2, 9);

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon!',
      data: { id: contactId }
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit contact form. Please try again.' },
      { status: 500 }
    );
  }
}
