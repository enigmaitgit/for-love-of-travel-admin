import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Optional: list media if you have a backend list endpoint
    const backendUrl = 'http://localhost:3000'; // Hardcoded for debugging
    const res = await fetch(`${backendUrl}/api/v1/media`, { cache: 'no-store' });
    const text = await res.text(); // avoid crash on non-JSON errors
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: res.status });
    } catch {
      return NextResponse.json({ success: false, error: text || 'Media list failed' }, { status: res.status });
    }
  } catch (fetchError) {
    // If backend is not available, return empty array for development
    console.warn('Backend not available, returning empty media list:', fetchError);
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Media list (backend unavailable)'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file field named "file"' }, { status: 400 });
    }

    const backendUrl = 'http://localhost:3000'; // Hardcoded for debugging

    const upstreamForm = new FormData();
    upstreamForm.append('file', file, file.name);

    // forward directly to backend media upload
    const res = await fetch(`${backendUrl}/api/v1/media/upload`, {
      method: 'POST',
      body: upstreamForm,
      // DO NOT set Content-Type manually; let fetch set the multipart boundary
    });

    const text = await res.text(); // safe read
    let json: Record<string, unknown> | null = null;
    try { json = JSON.parse(text); } catch {}

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: (json as { error?: string })?.error || text || `Backend upload failed (${res.status})` },
        { status: res.status }
      );
    }

    // Normalize the shape we return to the client
    const d = (json as { data?: Record<string, unknown> })?.data || json || {};
    const filename = (d.filename as string) || (d.originalName as string) || file.name;
    const absoluteBackend = process.env.NEXT_PUBLIC_BACKEND_URL || backendUrl;

    // If backend didn't supply a full url, build one using serve endpoint:
    const url =
      d.url && (typeof d.url === 'string' && (d.url.startsWith('http') || d.url.startsWith('/')))
        ? (d.url.startsWith('/uploads/') 
            ? `${absoluteBackend}/api/v1/media/serve/${d.url.replace('/uploads/', '')}`
            : d.url.startsWith('/') 
              ? `${absoluteBackend}${d.url}` 
              : d.url)
        : `${absoluteBackend}/api/v1/media/serve/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        _id: (d._id as string) || (d.id as string) || filename,
        filename,
        mimeType: (d.mimeType as string) || file.type,
        size: (d.size as number) || file.size,
        url,
        uploadedAt: (d.uploadedAt as string) || new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || 'Upload proxy failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const pathname = new URL(request.url).pathname;

    const backendUrl = 'http://localhost:3000'; // Hardcoded for debugging

    // Handle bulk delete
    if (pathname.endsWith('/bulk')) {
      const body = await request.json();
      const { mediaIds } = body;

      if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
        return NextResponse.json({ success: false, error: 'Media IDs must be provided as an array' }, { status: 400 });
      }

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
    }

    // Handle single delete
    if (!id) {
      return NextResponse.json({ success: false, error: 'Media ID is required' }, { status: 400 });
    }
    
    // Forward delete request to backend
    const res = await fetch(`${backendUrl}/api/v1/media/${id}`, {
      method: 'DELETE',
    });

    const text = await res.text();
    let json: Record<string, unknown> | null = null;
    try { json = JSON.parse(text); } catch {}

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: (json as { error?: string })?.error || text || `Backend delete failed (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || 'Delete proxy failed' },
      { status: 500 }
    );
  }
}