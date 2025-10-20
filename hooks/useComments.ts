import { useState, useEffect } from 'react';

export interface Comment {
  _id: string;
  id?: string;
  content: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  postId: string | { title: string; slug: string; _id: string };
  post?: {
    _id: string;
    title: string;
    slug?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'spam' | 'reported';
  rating?: number;
  likes?: number;
  dislikes?: number;
  reports?: number;
  replies?: number;
  createdAt: string;
  updatedAt: string;
  lastModified?: string;
}

export interface CommentsResponse {
  success: boolean;
  data: Comment[];
  total: number;
  page: number;
  limit: number;
  count: number;
  error?: string;
}

export interface UseCommentsOptions {
  page?: number;
  limit?: number;
  status?: string;
  post?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useComments(options: UseCommentsOptions = {}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(options.page || 1);
  const [limit, setLimit] = useState(options.limit || 10);

  const fetchComments = async (fetchOptions: UseCommentsOptions = {}) => {
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
      if (fetchOptions.post || options.post) {
        params.append('post', fetchOptions.post || options.post || '');
      }
      if (fetchOptions.search || options.search) {
        params.append('search', fetchOptions.search || options.search || '');
      }

      const response = await fetch(`/api/admin/comments?${params.toString()}`);
      const data: CommentsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments');
      }

      if (data.success) {
        // Transform the data to match the expected format (same as comment moderation table)
        const transformedComments = (data.data || []).map((comment: any) => ({
          ...comment,
          id: comment._id || comment.id,
          post: typeof comment.postId === 'object' ? {
            _id: comment.postId._id,
            title: comment.postId.title,
            slug: comment.postId.slug
          } : undefined
        }));
        setComments(transformedComments);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setLimit(data.limit || 10);
      } else {
        throw new Error(data.error || 'Failed to fetch comments');
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const refresh = () => {
    fetchComments();
  };

  const updateOptions = (newOptions: UseCommentsOptions) => {
    fetchComments(newOptions);
  };

  const updateCommentStatus = async (commentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update comment status');
      }

      // Refresh comments after update
      refresh();
    } catch (err) {
      console.error('Error updating comment status:', err);
      throw err;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      // Refresh comments after deletion
      refresh();
    } catch (err) {
      console.error('Error deleting comment:', err);
      throw err;
    }
  };

  return {
    comments,
    loading,
    error,
    total,
    page,
    limit,
    refresh,
    updateOptions,
    fetchComments,
    updateCommentStatus,
    deleteComment
  };
}

// Hook specifically for dashboard - fetches recent comments
export function useRecentComments(limit: number = 5) {
  const { comments, loading, error, refresh, updateCommentStatus, deleteComment } = useComments({
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  return {
    recentComments: comments,
    loading,
    error,
    refresh,
    updateCommentStatus,
    deleteComment
  };
}
