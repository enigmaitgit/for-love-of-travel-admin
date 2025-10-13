import { NextRequest, NextResponse } from 'next/server';
import { getSessionRole, can } from '@/lib/rbac';

// PATCH /api/admin/users/[id]/role - Update user role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'user:edit')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { role: newRole } = body;

    if (!newRole) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    const validRoles = ['admin', 'editor', 'contributor'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, editor, or contributor' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/admin/users/${resolvedParams.id}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: newRole }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Failed to update user role',
          details: errorData.error || `Backend API error: ${response.status}`
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
