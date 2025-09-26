import { NextRequest, NextResponse } from 'next/server';
import { getMediaAssets, uploadMedia, deleteMediaAsset, deleteAllMediaAssets } from '@/lib/api';
import { getSessionRole, can } from '@/lib/rbac';

// GET /api/admin/media - List media assets
export async function GET() {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'media:upload')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const assets = await getMediaAssets();
    
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching media assets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/media - Upload media file
export async function POST(request: NextRequest) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'media:upload')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('Media upload - formData entries:', Array.from(formData.entries()));
    console.log('Media upload - file received:', file);

    if (!file) {
      console.error('Media upload - no file in formData');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Validate file size (25MB max)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB' },
        { status: 400 }
      );
    }

    console.log('Media upload - file received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    const result = await uploadMedia(file);
    
    console.log('Media upload - result:', result);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error uploading media:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/media - Delete media assets
export async function DELETE(request: NextRequest) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'media:delete')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (action === 'delete-all') {
      const count = await deleteAllMediaAssets();
      return NextResponse.json({ 
        success: true, 
        message: `Deleted ${count} media assets`,
        count 
      });
    } else if (action === 'delete' && id) {
      const deleted = await deleteMediaAsset(id);
      if (deleted) {
        return NextResponse.json({ 
          success: true, 
          message: 'Media asset deleted successfully' 
        });
      } else {
        return NextResponse.json(
          { error: 'Media asset not found' },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid request. Specify action (delete or delete-all) and id if needed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
