import { NextResponse } from 'next/server';

// Simple in-memory storage for reports (in production, this would be a database)
interface Report {
  id: string;
  commentId: string;
  reason: string;
  description: string;
  timestamp: string;
  status: string;
}

const reports: Report[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    
    let filteredReports = reports;
    if (commentId) {
      filteredReports = reports.filter(report => report.commentId === commentId);
    }
    
    return NextResponse.json({
      success: true,
      data: filteredReports,
      total: filteredReports.length
    });
  } catch (error) {
    console.error('Admin Error fetching reports:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const report = {
      id: `report_${Date.now()}`,
      commentId: body.commentId,
      reason: body.reason,
      description: body.description,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    reports.push(report);
    
    return NextResponse.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Admin Error creating report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create report' },
      { status: 500 }
    );
  }
}