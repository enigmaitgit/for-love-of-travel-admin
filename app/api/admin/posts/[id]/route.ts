import { NextRequest, NextResponse } from 'next/server';
import { PostDraftSchema, PostPublishSchema } from '@/lib/validation';
import { getPost, updatePost, deletePost } from '@/lib/api';

// GET /api/admin/posts/[id] - Get post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const post = await getPost(resolvedParams.id);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(post);
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
    const body = await request.json();
    console.log('PATCH request - Body received:', body);
    
    const resolvedParams = await params;
    console.log('PATCH request - Getting existing post with ID:', resolvedParams.id);
    
    // Get existing post data
    const existingPost = await getPost(resolvedParams.id);
    if (!existingPost) {
      console.log('PATCH request - Post not found');
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Merge existing data with new data
    const mergedData = { ...existingPost, ...body };
    console.log('PATCH request - Merged data:', mergedData);
    
    // Determine which schema to use based on status
    const status = body.status;
    console.log('PATCH request - Status to change to:', status);
    let validatedData;
    
    if (status && ['review', 'scheduled', 'published'].includes(status)) {
      // Use publish schema for publishing actions
      console.log('PATCH request - Using PostPublishSchema');
      
      // Ensure required fields for publishing are present
      const publishData = {
        ...mergedData,
        body: mergedData.body || mergedData.content || 'Content will be added',
        tags: mergedData.tags && mergedData.tags.length > 0 ? mergedData.tags : ['general'],
        status: status
      };
      
      console.log('PATCH request - Publishing data with defaults:', publishData);
      validatedData = PostPublishSchema.parse(publishData);
    } else {
      // Use draft schema for draft updates
      console.log('PATCH request - Using PostDraftSchema');
      validatedData = PostDraftSchema.parse(mergedData);
    }

    console.log('PATCH request - Updating post with ID:', resolvedParams.id);
    console.log('PATCH request - Validated data:', validatedData);
    
    const updatedPost = await updatePost(resolvedParams.id, validatedData);
    console.log('PATCH request - Update result:', updatedPost);
    
    if (!updatedPost) {
      console.log('PATCH request - Post not found');
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    console.log('PATCH request - Post updated successfully');
    return NextResponse.json(updatedPost);
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
    const success = await deletePost(resolvedParams.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
