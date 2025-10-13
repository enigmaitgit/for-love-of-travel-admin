import { NextResponse } from 'next/server';

// This endpoint receives reports from the website frontend
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Forward the report to the admin reports API
    const reportResponse = await fetch(`${request.nextUrl.origin}/api/admin/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (reportResponse.ok) {
      const reportData = await reportResponse.json();
      return NextResponse.json({
        success: true,
        message: 'Report synced successfully',
        data: reportData
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to sync report'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error syncing report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to sync report' },
      { status: 500 }
    );
  }
}
