import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaIds } = body;

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Media IDs must be provided as an array' }, { status: 400 });
    }

    const backendUrl = 'http://localhost:3000'; // Hardcoded for debugging

    const res = await fetch(`${backendUrl}/api/v1/media/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mediaIds }),
    });

    const text = await res.text();
    let json: Record<string, unknown> | null = null;
    try { json = JSON.parse(text); } catch {}

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: (json as { error?: string })?.error || text || `Backend bulk delete failed (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json(json || { success: true, message: 'Bulk delete completed' });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || 'Bulk delete proxy failed' },
      { status: 500 }
    );
  }
}
