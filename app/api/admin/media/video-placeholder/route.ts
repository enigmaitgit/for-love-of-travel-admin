import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/v1/media/video-placeholder`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error(`Backend responded with ${res.status}`);
    }
    
    const svg = await res.text();
    
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching video placeholder:', error);
    
    // Fallback SVG if backend is not available
    const fallbackSvg = `
      <svg width="320" height="240" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="240" fill="#f3f4f6"/>
        <polygon points="120,80 120,160 200,120" fill="#6b7280"/>
        <text x="160" y="200" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">Video</text>
      </svg>
    `;
    
    return new NextResponse(fallbackSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}


