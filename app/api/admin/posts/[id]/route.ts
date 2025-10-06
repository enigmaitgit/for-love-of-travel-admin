import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PostDraftSchema, PostPublishSchema } from '@/lib/validation';

// GET /api/admin/posts/[id] - Get post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    // Guard: Validate and sanitize the ID before proxying to backend
    const postId = resolvedParams.id?.toString().trim();
    
    if (!postId || 
        postId === 'undefined' || 
        postId === 'null' || 
        postId === '' ||
        postId.length < 24) { // MongoDB ObjectId should be at least 24 chars
      console.error('🚫 API Guard: Invalid post ID:', { 
        original: resolvedParams.id, 
        sanitized: postId,
        type: typeof resolvedParams.id 
      });
      return NextResponse.json(
        { 
          error: 'Invalid post ID',
          message: 'The provided post ID is invalid or malformed'
        },
        { status: 400 }
      );
    }
    
    console.log('🔍 GET Post API: Requesting post ID:', postId);
    console.log('🔍 GET Post API: Backend URL:', `${backendUrl}/api/admin/posts/${postId}`);
    
    const response = await fetch(`${backendUrl}/api/admin/posts/${postId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }
      throw new Error(`Backend API error: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data.data || data);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/posts/[id] - Update post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('PATCH request - Starting API route');
    const body = await request.json();
    console.log('PATCH request - Body received:', body);
    
    const resolvedParams = await params;
    console.log('PATCH request - Resolved params:', resolvedParams);
    
    // Guard: Validate and sanitize the ID before proxying to backend
    const postId = resolvedParams.id?.toString().trim();
    
    if (!postId || 
        postId === 'undefined' || 
        postId === 'null' || 
        postId === '' ||
        postId.length < 24) { // MongoDB ObjectId should be at least 24 chars
      console.error('🚫 PATCH API Guard: Invalid post ID:', { 
        original: resolvedParams.id, 
        sanitized: postId,
        type: typeof resolvedParams.id 
      });
      return NextResponse.json(
        { 
          error: 'Invalid post ID',
          message: 'The provided post ID is invalid or malformed'
        },
        { status: 400 }
      );
    }
    
    console.log('PATCH request - Getting existing post with ID:', postId);
    
    // Call backend directly
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    console.log('PATCH request - Calling backend directly:', `${backendUrl}/api/admin/posts/${postId}`);
    
    const response = await fetch(`${backendUrl}/api/admin/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend API error:', response.status, errorData);
      
      return NextResponse.json(
        { 
          error: 'Failed to update post',
          details: errorData.message || `Backend API error: ${response.status}`,
          status: response.status
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('PATCH request - Backend response:', data);
    
    return NextResponse.json(data.data || data);
  } catch (error) {
    console.error('Error updating post:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      console.error('Validation error details:', error);
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.message,
          validationErrors: (error as { issues?: unknown[] }).issues || []
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/posts/[id] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    // Guard: Validate and sanitize the ID before proxying to backend
    const postId = resolvedParams.id?.toString().trim();
    
    if (!postId || 
        postId === 'undefined' || 
        postId === 'null' || 
        postId === '' ||
        postId.length < 24) { // MongoDB ObjectId should be at least 24 chars
      console.error('🚫 DELETE API Guard: Invalid post ID:', { 
        original: resolvedParams.id, 
        sanitized: postId,
        type: typeof resolvedParams.id 
      });
      return NextResponse.json(
        { 
          error: 'Invalid post ID',
          message: 'The provided post ID is invalid or malformed'
        },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${backendUrl}/api/admin/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }
      throw new Error(`Backend API error: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
