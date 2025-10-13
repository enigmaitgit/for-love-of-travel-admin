import { NextResponse } from 'next/server';

const ADMIN_BACKEND_URL = process.env.ADMIN_BACKEND_URL || 'http://localhost:5000';

export async function PATCH(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  try {
    const { reportId } = await params;
    const body = await request.json();
    
    // Forward the request to the admin backend
    const backendUrl = `${ADMIN_BACKEND_URL}/api/interactions/admin/reports/${reportId}/status`;
    
    const response = await fetch(backendUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating report status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update report status' },
      { status: 500 }
    );
  }
}
