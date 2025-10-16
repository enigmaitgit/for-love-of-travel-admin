import { useState, useEffect } from 'react';

export interface Post {
  _id: string;
  id?: string;
  title: string;
  slug?: string;
  body?: string;
  status: 'draft' | 'review' | 'scheduled' | 'published';
  featuredImage?: {
    url: string;
    alt?: string;
    caption?: string;
  } | string;
  featuredMedia?: {
    url: string;
    alt?: string;
    caption?: string;
    type: 'image' | 'video';
    width?: number;
    height?: number;
    duration?: number;
  };
  author: string;
  categories?: Array<{
    _id: string;
    name: string;
    slug: string;
  }>;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledAt?: string;
  readingTime?: number;
  views?: number;
  likes?: number;
  comments?: number;
}

export interface PostsResponse {
  success: boolean;
  rows: Post[];
  total: number;
  page: number;
  limit: number;
  error?: string;
}

export interface UsePostsOptions {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function usePosts(options: UsePostsOptions = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(options.page || 1);
  const [limit, setLimit] = useState(options.limit || 10);

  const fetchPosts = async (fetchOptions: UsePostsOptions = {}) => {
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
      if (fetchOptions.status || options.status) {
        params.append('status', fetchOptions.status || options.status || '');
      }
      if (fetchOptions.search || options.search) {
        params.append('search', fetchOptions.search || options.search || '');
      }
      if (fetchOptions.sortBy || options.sortBy) {
        params.append('sortBy', fetchOptions.sortBy || options.sortBy || 'updatedAt');
      }
      if (fetchOptions.sortOrder || options.sortOrder) {
        params.append('sortOrder', fetchOptions.sortOrder || options.sortOrder || 'desc');
      }

      const response = await fetch(`/api/admin/posts?${params.toString()}`);
      const data: PostsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch posts');
      }

      if (data.success) {
        console.log('📋 Posts fetched successfully:', {
          total: data.total,
          rowsCount: data.rows?.length || 0,
          posts: data.rows?.map((post: any) => ({
            id: post._id || post.id,
            title: post.title,
            status: post.status,
            createdAt: post.createdAt
          })) || []
        });
        setPosts(data.rows || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setLimit(data.limit || 10);
      } else {
        throw new Error(data.error || 'Failed to fetch posts');
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const refresh = () => {
    fetchPosts();
  };

  const updateOptions = (newOptions: UsePostsOptions) => {
    fetchPosts(newOptions);
  };

  return {
    posts,
    loading,
    error,
    total,
    page,
    limit,
    refresh,
    updateOptions,
    fetchPosts
  };
}

// Hook specifically for dashboard - fetches recent posts
export function useRecentPosts(limit: number = 4) {
  const { posts, loading, error, refresh } = usePosts({
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  return {
    recentPosts: posts,
    loading,
    error,
    refresh
  };
}
