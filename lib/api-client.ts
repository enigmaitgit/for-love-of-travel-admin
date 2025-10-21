import { getApiUrl, getAuthApiUrl, getBackendUrl } from './api-config';
import { getAuthHeader } from './auth-token';
import type { ContentSection } from './validation';

// Author type for backend responses
type AuthorResponse = {
  fullname?: string;
  name?: string;
  email?: string;
};

// Helper function to transform author from backend response
function transformAuthor(author: string | AuthorResponse | null): string {
  if (typeof author === 'string') {
    return author;
  }

  if (!author) {
    return 'Unknown Author';
  }

  return author.fullname || author.name || author.email || 'Unknown';
}

// Backend response types
type BackendPost = {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  body?: string;
  content?: string; // Backend uses 'content' field
  contentSections: unknown[];
  tags: string[];
  categories: (string | { _id: string; name: string })[];
  status: 'draft' | 'review' | 'scheduled' | 'published';
  author: string | AuthorResponse | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledAt?: string;
  featuredImage?: string | { url: string; alt?: string };
  featuredMedia?: {
    url: string;
    alt?: string;
    caption?: string;
    type: 'image' | 'video';
    width?: number;
    height?: number;
    duration?: number;
  };
  breadcrumb?: { enabled: boolean; items: Array<{ label: string; href: string }> };
  seoTitle?: string;
  metaDescription?: string;
  readingTime?: number;
  jsonLd?: boolean;
};

// Helper function to transform backend post to frontend post (client-safe version)
export function transformBackendPost(post: BackendPost): Post {
  try {
    console.log('transformBackendPost - Input post:', post);

    const transformed = {
      title: post.title,
      slug: post.slug,
      body: post.body || post.content || '', // Map content field to body
      contentSections: Array.isArray(post.contentSections) ? post.contentSections as ContentSection[] : [],
      tags: post.tags || [],
      categories: Array.isArray(post.categories)
        ? post.categories.map((cat: unknown) => {
            if (typeof cat === 'string') return cat;
            // If it's a populated object, return the object with name
            const catData = cat as { name?: string; _id?: string; id?: string };
            if (catData && typeof catData === 'object' && catData.name) {
              return catData;
            }
            // Fallback to ID if no name
            return catData._id || catData.id || cat;
          }) as (string | { _id: string; name: string })[]
        : [],
      featuredImage: post.featuredImage
        ? (typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage.url)
        : undefined,
      featuredMedia: post.featuredMedia || undefined,
      breadcrumb: post.breadcrumb || { enabled: true, items: [{ label: 'Home', href: '/' }] },
      jsonLd: post.jsonLd || false,
      seoTitle: post.seoTitle,
      metaDescription: post.metaDescription,
      readingTime: post.readingTime,
      id: post._id || post.id || '',
      author: transformAuthor(post.author),
      status: post.status,
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.updatedAt),
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : undefined,
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : undefined,
    };

    console.log('transformBackendPost - Transformed post:', transformed);
    return transformed;
  } catch (error) {
    console.error('transformBackendPost - Error transforming post:', error);
    console.error('transformBackendPost - Input post that caused error:', post);
    throw error;
  }
}

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

  // Handle server-side requests by using absolute URLs
  // Only add base URL when running on server (when window is undefined)
  const baseUrl = typeof window === 'undefined' 
    ? (process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000')
    : '';
  
  const url = `${baseUrl}${path}${toQueryString(query)}`;

  // let safeBodyLog: string | undefined;
  // try {
  //   safeBodyLog = body ? JSON.stringify(body) : undefined;
  // } catch {
  //   safeBodyLog = '[unserializable-body]';
  // }

  // console.log('🌐 API Request:', { method, url, body: safeBodyLog });

  // Get authorization header if available
  const authHeader = getAuthHeader();
  console.log('🔑 Auth header:', authHeader ? 'Present' : 'Missing');
  
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader && { 'Authorization': authHeader }),
      ...(headers ?? {}),
    },
    body: (body === undefined ? undefined : JSON.stringify(body)),
    credentials: 'include', // Include cookies for authentication
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`❌ API Error ${res.status}:`, text || 'Request failed');
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
  contentSections: ContentSection[];
  tags: string[];
  categories: (string | { _id: string; name: string })[];
  status: 'draft' | 'review' | 'scheduled' | 'published';
  author: string;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  publishedAt?: Date;
  featuredImage?: string | {
    url: string;
    alt?: string;
  };
  featuredMedia?: {
    url: string;
    alt?: string;
    caption?: string;
    type: 'image' | 'video';
    width?: number;
    height?: number;
    duration?: number;
  };
  breadcrumb?: {
    enabled: boolean;
    items: Array<{ label: string; href: string }>;
  };
  jsonLd?: boolean;
  seoTitle?: string;
  metaDescription?: string;
  readingTime?: number;
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

export type BackendPostResponse = {
  success: boolean;
  data: BackendPost;
};

// User API functions
export async function getUsers(searchParams: UserSearch): Promise<UserListResponse> {
  try {
    // console.log('Admin Panel: Fetching users with params:', searchParams);

    const query: Query = {
      search: searchParams.search,
      role: searchParams.role !== 'all' ? searchParams.role : undefined,
      status: searchParams.status !== 'all' ? searchParams.status : undefined,
      page: searchParams.page ?? 1,
      limit: searchParams.limit ?? 10,
    };

    const url = getAuthApiUrl('users');

    const res = await apiFetch<UserListResponse>(
      url,
      {
        method: 'GET',
        query,
      }
    );

    // console.log('Admin Panel: Users fetched successfully:', { 
    //   total: res.total, 
    //   count: res.count,
    //   dataLength: res.data?.length || 0
    // });

    return res;
  } catch (error) {
    console.error('Admin Panel: Error fetching users:', error);
    console.error('Admin Panel: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    throw error;
  }
}

export async function getUser(id: string): Promise<User | null> {
  try {
    console.log('Admin Panel: Fetching user with ID:', id);

    const res = await apiFetch<UserResponse>(
      getAuthApiUrl(`users/${id}`),
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
      getAuthApiUrl(`users/${id}/role`),
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

    const res = await apiFetch<BackendPostResponse>(
      getBackendUrl(`api/v1/admin/posts/${id}`),
      {
        method: 'GET',
      }
    );

    if (res?.data) {
      console.log('Admin Panel: Post fetched successfully:', res.data);
      return transformBackendPost(res.data);
    }

    return null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    console.error('Admin Panel: Error fetching post:', error);
    throw error;
  }
}

// User Profile API functions
export interface UserProfile {
  _id?: string;
  id?: string;
  fullname?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  avatar?: unknown; // Your backend returns an object, not a string
  socialLinks?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileResponse {
  success: boolean;
  data: {
    user: UserProfile;
  };
  message?: string;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    console.log('🔍 Making request to verify endpoint with httpOnly cookie...');
    
    // Make direct fetch call to verify endpoint with credentials: "include" to send httpOnly cookies
    const res = await fetch(getBackendUrl('api/v1/authorization/verify'), {
      method: 'GET',
      credentials: 'include', // 👈 This will automatically send httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`❌ API Error ${res.status}:`, text || 'Request failed');
      throw new ApiError(res.status, text || 'Request failed');
    }

    const data = await res.json() as UserProfileResponse;

    if (data?.data?.user) {
      console.log('✅ User profile verified successfully:', data.data.user);
      return data.data.user;
    }

    return null;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      console.log(`🔒 Authentication failed (${error.status}): ${error.body}`);
      console.log('💡 Please check if your JWT token cookie is valid and not expired');
      return null;
    }
    console.error('❌ Error fetching user profile:', error);
    throw error;
  }
}

// Logout API function
export async function logout(): Promise<boolean> {
  try {
    console.log('🚪 Logging out user...');
    
    // Make logout request to backend with credentials: "include" to send httpOnly cookies
    const res = await fetch(getBackendUrl('api/v1/authorization/logout'), {
      method: 'POST',
      credentials: 'include', // 👈 This will automatically send httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`❌ Logout API Error ${res.status}:`, text || 'Request failed');
      throw new ApiError(res.status, text || 'Request failed');
    }

    console.log('✅ Logout successful');
    return true;
  } catch (error) {
    console.error('❌ Error during logout:', error);
    throw error;
  }
}
