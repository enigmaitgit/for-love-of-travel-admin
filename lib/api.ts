// API Configuration for Admin Panel
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Media Asset type definition
export interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number; // Duration in seconds
  uploadedAt: Date | string;
  uploadedBy?: string;
  altText?: string;
  caption?: string;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}

// Import types from hooks
import type { Post } from '@/hooks/usePosts';
import type { Category } from '@/hooks/useCategories';
import type { User } from '@/hooks/useUsers';

// Content Page interface
export interface ContentPage {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  content: string;
  contentSections?: unknown[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
  author?: string;
  tags?: string[];
  category?: string;
  featuredImage?: string;
  metaDescription?: string;
  seoTitle?: string;
}

// API Response handler
export const handleApiResponse = async <T = unknown>(response: Response, url?: string): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`❌ API Error for ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      url: url,
      error: errorData
    });
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Generic API request function
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Check if body is FormData to avoid forcing JSON headers
  const isFormData = options.body instanceof FormData;
  
  const defaultOptions: RequestInit = {
    headers: {
      // Only set Content-Type to JSON if not FormData and no custom headers provided
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);
    return await handleApiResponse<T>(response, url);
  } catch (error) {
    console.error(`❌ API Request failed for ${url}:`, error);
    throw error;
  }
};

// Homepage Sections API
export const homepageSectionsApi = {
  getHomepageSections: async (params: {
    type?: string;
    isActive?: boolean;
    isPublished?: boolean;
    includeData?: boolean;
  } = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)])
    ).toString();
    const endpoint = queryString ? `/v1/homepage-sections?${queryString}` : '/v1/homepage-sections';
    return apiRequest(endpoint);
  },

  getPublishedHomepageSections: async () => {
    return apiRequest('/v1/homepage-sections/published');
  },

  getHomepageSection: async (id: string) => {
    return apiRequest(`/v1/homepage-sections/${id}`);
  },

  createHomepageSection: async (sectionData: Record<string, unknown>) => {
    return apiRequest('/v1/homepage-sections', {
      method: 'POST',
      body: JSON.stringify(sectionData),
    });
  },

  updateHomepageSection: async (id: string, sectionData: Record<string, unknown>) => {
    return apiRequest(`/v1/homepage-sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sectionData),
    });
  },

  deleteHomepageSection: async (id: string) => {
    return apiRequest(`/v1/homepage-sections/${id}`, {
      method: 'DELETE',
    });
  },

  reorderHomepageSections: async (sections: Array<{ id: string }>) => {
    return apiRequest('/v1/homepage-sections/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ sections }),
    });
  },

  publishHomepageSection: async (id: string) => {
    return apiRequest(`/v1/homepage-sections/${id}/publish`, {
      method: 'PATCH',
    });
  },

  unpublishHomepageSection: async (id: string) => {
    return apiRequest(`/v1/homepage-sections/${id}/unpublish`, {
      method: 'PATCH',
    });
  },

  toggleSectionActive: async (id: string) => {
    return apiRequest(`/v1/homepage-sections/${id}/toggle-active`, {
      method: 'PATCH',
    });
  },

  duplicateHomepageSection: async (id: string) => {
    return apiRequest(`/v1/homepage-sections/${id}/duplicate`, {
      method: 'POST',
    });
  },

  getHomepageSectionAnalytics: async (id: string, timeframe: string = '30d') => {
    const params = new URLSearchParams({ timeframe });
    return apiRequest(`/v1/homepage-sections/${id}/analytics?${params}`);
  },

  updateHomepageSectionAnalytics: async (id: string, type: 'view' | 'click' | 'engagement', value: number = 1) => {
    return apiRequest(`/v1/homepage-sections/${id}/analytics`, {
      method: 'PATCH',
      body: JSON.stringify({ type, value }),
    });
  },
};

// View Analytics API
export const viewAnalyticsApi = {
  trackView: async (postId: string, postType: 'post' | 'simplePost' = 'post') => {
    return apiRequest('/v1/analytics/track-view', {
      method: 'POST',
      body: JSON.stringify({ postId, postType }),
    });
  },

  getPopularPostsWithAnalytics: async (
    limit: number = 10,
    timeframe: string = '30d',
    algorithm: string = 'weighted',
    postType: string = 'all'
  ) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      timeframe,
      algorithm,
      postType
    });
    return apiRequest(`/v1/analytics/popular-posts?${params}`);
  },

  getPostAnalytics: async (postId: string, postType: 'post' | 'simplePost' = 'post') => {
    const params = new URLSearchParams({ postType });
    return apiRequest(`/v1/analytics/post/${postId}?${params}`);
  },

  getAnalyticsDashboard: async (timeframe: string = '30d') => {
    const params = new URLSearchParams({ timeframe });
    return apiRequest(`/v1/analytics/dashboard?${params}`);
  },
};

// Posts API (existing functionality)
export const postsApi = {
  getPosts: async (params: Record<string, unknown> = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)])
    ).toString();
    const endpoint = queryString ? `/v1/posts?${queryString}` : '/v1/posts';
    return apiRequest(endpoint);
  },

  getPost: async (id: string) => {
    return apiRequest(`/v1/posts/${id}`);
  },

  createPost: async (postData: Partial<Post>) => {
    return apiRequest('/v1/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  updatePost: async (id: string, postData: Partial<Post>) => {
    return apiRequest(`/v1/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  },

  deletePost: async (id: string) => {
    return apiRequest(`/v1/posts/${id}`, {
      method: 'DELETE',
    });
  },

  getPopularPosts: async (limit: number = 10, timeframe: string = '30d') => {
    return apiRequest(`/v1/posts/popular?limit=${limit}&timeframe=${timeframe}`);
  },
};

// Categories API
export const categoriesApi = {
  getCategories: async () => {
    return apiRequest('/api/admin/categories');
  },

  getCategory: async (id: string) => {
    return apiRequest(`/api/admin/categories/${id}`);
  },

  createCategory: async (categoryData: Partial<Category>) => {
    return apiRequest('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  updateCategory: async (id: string, categoryData: Partial<Category>) => {
    return apiRequest(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  deleteCategory: async (id: string) => {
    return apiRequest(`/api/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Users API
export const usersApi = {
  getUsers: async () => {
    return apiRequest('/v1/users');
  },

  getUser: async (id: string) => {
    return apiRequest(`/v1/users/${id}`);
  },

  createUser: async (userData: Partial<User>) => {
    return apiRequest('/v1/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    return apiRequest(`/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (id: string) => {
    return apiRequest(`/v1/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Comments API
export const commentsApi = {
  getComments: async (params: Record<string, unknown> = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)])
    ).toString();
    const endpoint = queryString ? `/v1/comments?${queryString}` : '/v1/comments';
    return apiRequest(endpoint);
  },

  getComment: async (id: string) => {
    return apiRequest(`/v1/comments/${id}`);
  },

  updateCommentStatus: async (id: string, status: string) => {
    return apiRequest(`/v1/comments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  deleteComment: async (id: string) => {
    return apiRequest(`/v1/comments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Media API
export const mediaApi = {
  getMedia: async (params: Record<string, unknown> = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)])
    ).toString();
    const endpoint = queryString ? `/v1/media?${queryString}` : '/v1/media';
    return apiRequest(endpoint);
  },

  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiRequest('/v1/media/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type header to let browser set it with boundary
    });
  },

  deleteMedia: async (id: string) => {
    return apiRequest(`/v1/media/${id}`, {
      method: 'DELETE',
    });
  },
};

// Video Analytics API
export const videoAnalyticsApi = {
  getVideoAnalytics: async () => {
    return apiRequest('/v1/homepage-content/videos/analytics');
  },

  getPopularVideos: async (limit: number = 8) => {
    return apiRequest(`/v1/homepage-content/videos/popular?limit=${limit}`);
  },

  trackVideoView: async (videoId: string) => {
    return apiRequest(`/v1/homepage-content/videos/${videoId}/view`, {
      method: 'POST',
    });
  },

  trackVideoClick: async (videoId: string) => {
    return apiRequest(`/v1/homepage-content/videos/${videoId}/click`, {
      method: 'POST',
    });
  },

  trackVideoPlayTime: async (videoId: string, playTime: number, duration: number) => {
    return apiRequest(`/v1/homepage-content/videos/${videoId}/playtime`, {
      method: 'POST',
      body: JSON.stringify({ playTime, duration }),
    });
  },
};

// Health check
export const healthCheck = async () => {
  return apiRequest('/health');
};

// Export all APIs
export const api = {
  homepageSectionsApi,
  viewAnalyticsApi,
  postsApi,
  categoriesApi,
  usersApi,
  commentsApi,
  mediaApi,
  videoAnalyticsApi,
  healthCheck,
};

export default api;