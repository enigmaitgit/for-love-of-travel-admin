import { NextRequest, NextResponse } from 'next/server';
import { PostDraftSchema, PostPublishSchema } from '@/lib/validation';
import { getPost, updatePost, deletePost } from '@/lib/api';
import { getSessionRole, can } from '@/lib/rbac';

// GET /api/admin/posts/[id] - Get post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'post:edit')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const post = await getPost(params.id);
    
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
  { params }: { params: { id: string } }
) {
  try {
    const role = getSessionRole();
    console.log('PATCH request - User role:', role);
    
    if (!can(role, 'post:edit')) {
      console.log('Insufficient permissions for post:edit');
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('PATCH request - Body received:', body);
    
    console.log('PATCH request - Getting existing post with ID:', params.id);

    // Get existing post data
    const existingPost = await getPost(params.id);
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
      console.log('PATCH request - Checking publish permissions for status:', status);
      if (!can(role, 'post:publish')) {
        console.log('Insufficient permissions for post:publish');
        return NextResponse.json(
          { error: 'Insufficient permissions to publish' },
          { status: 403 }
        );
      }
      
      // Ensure required fields for publishing are present
      const publishData = {
        ...mergedData,
        body: mergedData.body || mergedData.content || 'Content will be added',
        tags: mergedData.tags && mergedData.tags.length > 0 ? mergedData.tags : ['general'],
        status: status
      };
      
      console.log('PATCH request - Publishing data with defaults:', publishData);
      console.log('PATCH request - Using PostPublishSchema');
      validatedData = PostPublishSchema.parse(publishData);
    } else {
      // Use draft schema for draft updates
      console.log('PATCH request - Using PostDraftSchema');
      validatedData = PostDraftSchema.parse(mergedData);
    }

    console.log('PATCH request - Updating post with ID:', params.id);
    console.log('PATCH request - Validated data:', validatedData);

    const updatedPost = await updatePost(params.id, validatedData);
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
          validationErrors: error.issues || []
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
  { params }: { params: { id: string } }
) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'post:delete')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const success = await deletePost(params.id);
    
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
