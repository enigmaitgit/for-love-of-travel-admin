import { NextRequest, NextResponse } from 'next/server';
import { can, getSessionRole } from '@/lib/rbac';
import { getPost } from '@/lib/api';
import { SiteSyncError, syncPostToSite } from '@/lib/siteSync';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = getSessionRole();

    if (!can(role, 'post:publish')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to upload to main website' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const postId = resolvedParams?.id;

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const post = await getPost(postId);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const syncResult = await syncPostToSite(post);

    return NextResponse.json({
      success: true,
      message: 'Post uploaded to main website successfully',
      sync: {
        idempotencyKey: syncResult.idempotencyKey,
        httpStatus: syncResult.httpStatus,
        payload: syncResult.payload,
        response: syncResult.responseBody,
      },
    });
  } catch (error) {
    console.error('Error uploading post to main website:', error);

    if (error instanceof SiteSyncError) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload post to main website' },
      { status: 500 }
    );
  }
}
