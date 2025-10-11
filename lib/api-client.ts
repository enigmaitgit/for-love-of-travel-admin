import { getApiUrl } from './api-config';

// Typed API layer for client-side use
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type Query = Record<string, string | number | boolean | undefined>;

export type ApiHeaders = Record<string, string>;

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`API Error ${status}`);
    this.name = 'ApiError';
  }
}

function toQueryString(q?: Query) {
  if (!q) return '';
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.append(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

/**
 * Generic JSON fetcher without `any`
 * - TResponse: the JSON shape you expect back
 * - TBody: the JSON you send (if any)
 */
export async function apiFetch<TResponse, TBody = undefined>(
  path: string,
  opts: {
    method?: HttpMethod;
    query?: Query;
    body?: TBody;
    headers?: ApiHeaders;
  } = {}
): Promise<TResponse> {
  const { method = 'GET', query, body, headers } = opts;

  const url = `${path}${toQueryString(query)}`;

  let safeBodyLog: string | undefined;
  try {
    safeBodyLog = body ? JSON.stringify(body) : undefined;
  } catch {
    safeBodyLog = '[unserializable-body]';
  }

  console.log('🌐 API Request:', {
    method,
    url,
    body: safeBodyLog,
  });

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    body: (body === undefined ? undefined : JSON.stringify(body)),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || 'Request failed');
  }

  // If endpoint returns no content
  if (res.status === 204) return undefined as unknown as TResponse;

  return (await res.json()) as TResponse;
}

// User types
export type User = {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'contributor';
  status: 'active' | 'inactive';
  avatar?: string;
  lastActive: string;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
};

export type UserSearch = {
  search?: string;
  role?: 'all' | 'admin' | 'editor' | 'contributor';
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  limit?: number;
};

export type UserListResponse = {
  success: boolean;
  data: User[];
  total: number;
  page: number;
  pages: number;
  count: number;
};

export type UserResponse = {
  success: boolean;
  data: User;
};

// Post types (simplified for client-side use)
export type Post = {
  id: string;
  title: string;
  slug: string;
  body?: string;
  contentSections: unknown[];
  tags: string[];
  categories: string[];
  status: 'draft' | 'review' | 'scheduled' | 'published';
  author: string;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  publishedAt?: Date;
  featuredImage?: string;
  breadcrumb?: {
    enabled: boolean;
    items: Array<{ label: string; href: string }>;
  };
  jsonLd?: boolean;
};

export type PostSearch = {
  search?: string;
  status?: 'all' | 'draft' | 'review' | 'scheduled' | 'published';
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type PostListResponse = {
  success: boolean;
  data: Post[];
  total: number;
  page: number;
  pages: number;
  count: number;
};

export type PostResponse = {
  success: boolean;
  data: Post;
};

// User API functions
export async function getUsers(searchParams: UserSearch): Promise<UserListResponse> {
  try {
    console.log('Admin Panel: Fetching users with params:', searchParams);

    const query: Query = {
      search: searchParams.search,
      role: searchParams.role !== 'all' ? searchParams.role : undefined,
      status: searchParams.status !== 'all' ? searchParams.status : undefined,
      page: searchParams.page ?? 1,
      limit: searchParams.limit ?? 10,
    };

    const res = await apiFetch<UserListResponse>(
      getApiUrl('admin/users'),
      {
        method: 'GET',
        query,
      }
    );

    console.log('Admin Panel: Users fetched successfully:', { 
      total: res.total, 
      page: res.page, 
      pages: res.pages, 
      count: res.count 
    });

    return res;
  } catch (error) {
    console.error('Admin Panel: Error fetching users:', error);
    throw error;
  }
}

export async function getUser(id: string): Promise<User | null> {
  try {
    console.log('Admin Panel: Fetching user with ID:', id);

    const res = await apiFetch<UserResponse>(
      getApiUrl(`admin/users/${id}`),
      {
        method: 'GET',
      }
    );

    if (res?.data) {
      console.log('Admin Panel: User fetched successfully:', res.data);
      return res.data;
    }

    console.log('Admin Panel: User not found');
    return null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      console.log('Admin Panel: User not found');
      return null;
    }
    console.error('Admin Panel: Error fetching user:', error);
    throw error;
  }
}

export async function updateUserRole(id: string, role: string): Promise<User> {
  try {
    console.log('Admin Panel: Updating user role:', { id, role });

    const res = await apiFetch<UserResponse, { role: string }>(
      getApiUrl(`admin/users/${id}/role`),
      {
      method: 'PATCH',
        body: { role },
      }
    );

    if (res?.data) {
      console.log('Admin Panel: User role updated successfully:', res.data);
      return res.data;
    }

    throw new Error('No data returned from role update');
  } catch (error) {
    console.error('Admin Panel: Error updating user role:', error);
    throw error;
  }
}

// Post API functions
export async function getPost(id: string): Promise<Post | null> {
  try {
    console.log('Admin Panel: Fetching post with ID:', id);

    const res = await apiFetch<PostResponse>(
      getApiUrl(`admin/posts/${id}`),
      {
        method: 'GET',
      }
    );

    if (res?.data) {
      console.log('Admin Panel: Post fetched successfully:', res.data);
      return res.data;
    }

    console.log('Admin Panel: Post not found');
    return null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      console.log('Admin Panel: Post not found');
      return null;
    }
    console.error('Admin Panel: Error fetching post:', error);
    throw error;
  }
}
