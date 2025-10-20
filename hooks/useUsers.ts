import { useState, useEffect } from 'react';

export interface User {
  _id: string;
  id?: string;
  name: string;
  fullname?: string;
  email: string;
  role: 'admin' | 'editor' | 'contributor';
  status: 'active' | 'inactive';
  avatar?: string;
  lastActive?: string;
  joinDate?: string;
  createdAt: string;
  updatedAt: string;
  connections?: number;
  connected?: boolean;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  total: number;
  page: number;
  limit: number;
  count: number;
  error?: string;
}

export interface UseUsersOptions {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useUsers(options: UseUsersOptions = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(options.page || 1);
  const [limit, setLimit] = useState(options.limit || 10);

  const fetchUsers = async (fetchOptions: UseUsersOptions = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (fetchOptions.page || page) {
        params.append('page', String(fetchOptions.page || page));
      }
      if (fetchOptions.limit || limit) {
        params.append('limit', String(fetchOptions.limit || limit));
      }
      if (fetchOptions.role || options.role) {
        params.append('role', fetchOptions.role || options.role || '');
      }
      if (fetchOptions.status || options.status) {
        params.append('status', fetchOptions.status || options.status || '');
      }
      if (fetchOptions.search || options.search) {
        params.append('search', fetchOptions.search || options.search || '');
      }
      if (fetchOptions.sortBy || options.sortBy) {
        params.append('sortBy', fetchOptions.sortBy || options.sortBy || 'createdAt');
      }
      if (fetchOptions.sortOrder || options.sortOrder) {
        params.append('sortOrder', fetchOptions.sortOrder || options.sortOrder || 'desc');
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data: UsersResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      if (data.success) {
        setUsers(data.data || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setLimit(data.limit || 10);
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const refresh = () => {
    fetchUsers();
  };

  const updateOptions = (newOptions: UseUsersOptions) => {
    fetchUsers(newOptions);
  };

  return {
    users,
    loading,
    error,
    total,
    page,
    limit,
    refresh,
    updateOptions,
    fetchUsers
  };
}

// Hook specifically for dashboard - fetches recent contributors (Editor and Contributor roles only)
export function useRecentContributors(limit: number = 4) {
  const [contributors, setContributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContributors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the admin backend API for users
      const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendApiUrl}/api/v1/users?role=all&status=all&page=1&limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users from auth API');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Filter for Editor and Contributor roles only
        const filteredUsers = data.data.filter((user: any) => 
          user.role === 'editor' || user.role === 'contributor'
        );

        // Transform users to contributors format
        const transformedContributors = filteredUsers
          .slice(0, limit) // Take only the requested limit
          .map((user: any) => ({
            name: user.fullname || user.name,
            avatar: user.avatar || '300-1.png',
            connected: Math.random() > 0.5, // Mock connection status
            role: user.role,
            status: user.status,
            lastActive: user.lastActive || user.updatedAt,
            email: user.email
          }));

        setContributors(transformedContributors);
      } else {
        throw new Error('Invalid response format from auth API');
      }
    } catch (err) {
      console.error('Error fetching contributors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch contributors');
      
      // Fallback to mock data if auth API fails
      setContributors([
        {
          name: 'Editor User',
          avatar: '300-3.png',
          connected: true,
          role: 'editor',
          status: 'active',
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          email: 'editor@loveoftravel.com'
        },
        {
          name: 'Contributor User',
          avatar: '300-7.png',
          connected: false,
          role: 'contributor',
          status: 'active',
          lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          email: 'contributor@loveoftravel.com'
        },
        {
          name: 'Guest Writer',
          avatar: '300-14.png',
          connected: true,
          role: 'contributor',
          status: 'active',
          lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          email: 'guest@loveoftravel.com'
        },
        {
          name: 'Content Editor',
          avatar: '300-1.png',
          connected: false,
          role: 'editor',
          status: 'active',
          lastActive: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          email: 'content@loveoftravel.com'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributors();
  }, [limit]);

  const refresh = () => {
    fetchContributors();
  };

  return {
    contributors,
    loading,
    error,
    refresh
  };
}
