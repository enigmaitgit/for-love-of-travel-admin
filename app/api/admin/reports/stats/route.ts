import { NextResponse } from 'next/server';

const ADMIN_BACKEND_URL = process.env.ADMIN_BACKEND_URL || 'http://localhost:5000';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Forward the request to the admin backend
    const queryString = searchParams.toString();
    const backendUrl = `${ADMIN_BACKEND_URL}/api/interactions/admin/reports/stats${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch report statistics' },
      { status: 500 }
    );
  }
}
