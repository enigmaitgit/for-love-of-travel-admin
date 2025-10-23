import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/subcategory-pages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching subcategory pages:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subcategory pages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward cookies and authorization headers
    const cookieHeader = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/subcategory-pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }),
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating subcategory page:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create subcategory page' },
      { status: 500 }
    );
  }
}
