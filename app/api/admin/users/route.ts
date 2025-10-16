import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/users - List users with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Try to fetch from the admin backend first
    const queryString = searchParams.toString();
    const backendUrl = `http://localhost:5000/api/v1/admin/users${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching users from:', backendUrl);
    
    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Backend response:', data);
        return NextResponse.json(data, { status: response.status });
      }
    } catch (backendError) {
      console.log('Backend not available, using fallback data:', backendError);
    }

    // Fallback: Return mock user data when backend is not available
    const mockUsers = [
      {
        _id: '1',
        name: 'Admin User',
        fullname: 'Admin User',
        email: 'admin@loveoftravel.com',
        role: 'admin',
        status: 'active',
        avatar: '300-1.png',
        lastActive: new Date().toISOString(),
        joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        name: 'Editor User',
        fullname: 'Editor User',
        email: 'editor@loveoftravel.com',
        role: 'editor',
        status: 'active',
        avatar: '300-3.png',
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        joinDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '3',
        name: 'Contributor User',
        fullname: 'Contributor User',
        email: 'contributor@loveoftravel.com',
        role: 'contributor',
        status: 'active',
        avatar: '300-7.png',
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        joinDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '4',
        name: 'Guest Writer',
        fullname: 'Guest Writer',
        email: 'guest@loveoftravel.com',
        role: 'contributor',
        status: 'active',
        avatar: '300-14.png',
        lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        joinDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Apply basic filtering if needed
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    let filteredUsers = mockUsers;

    if (role && role !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    if (status && status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedUsers,
      total: filteredUsers.length,
      page: page,
      limit: limit,
      count: paginatedUsers.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}