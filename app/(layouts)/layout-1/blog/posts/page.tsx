'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Filter, Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useSnackbar } from '@/components/ui/snackbar';
import { getCurrentUserPermissions, getSessionRole } from '@/lib/rbac';
import { Post } from '@/lib/api';
import { PostSearch } from '@/lib/validation';

export default function PostsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSnackbar } = useSnackbar();
  
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [selectedPosts, setSelectedPosts] = React.useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deletePostId, setDeletePostId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = React.useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = React.useState(false);
  
  // Filters - memoized to prevent infinite re-renders
  const filters = React.useMemo(() => ({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as 'all' | 'draft' | 'review' | 'scheduled' | 'published') || 'all',
    author: searchParams.get('author') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
  }), [searchParams]);

  const [filtersState, setFiltersState] = React.useState<PostSearch>(filters);

  const permissions = getCurrentUserPermissions();
  const currentRole = getSessionRole();

  // Fetch posts
  const fetchPosts = React.useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filtersState).forEach(([key, value]) => {
        if (value) queryParams.set(key, value.toString());
      });

      const response = await fetch(`/api/admin/posts?${queryParams}`);
      const data = await response.json();
      
      if (response.ok) {
        setPosts(data.rows);
        setTotal(data.total);
        setHasInitiallyLoaded(true);
      } else {
        console.error('Error fetching posts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [filtersState]);

  // Initial load and when filters change
  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Update URL when filters change
  React.useEffect(() => {
    const queryParams = new URLSearchParams();
    Object.entries(filtersState).forEach(([key, value]) => {
      if (value) queryParams.set(key, value.toString());
    });
    
    const newUrl = `${window.location.pathname}?${queryParams}`;
    window.history.replaceState({}, '', newUrl);
  }, [filtersState]);

  const handleFilterChange = (key: keyof PostSearch, value: string | number) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleSelectPost = (postId: string, checked: boolean) => {
    setSelectedPosts(prev => 
      checked 
        ? [...prev, postId]
        : prev.filter(id => id !== postId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedPosts(checked ? posts.map(post => post.id) : []);
  };

  const handleDeletePost = async (postId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        await fetchPosts(); // Refresh the list
        setShowDeleteModal(false);
        setDeletePostId(null);
        showSnackbar('Post deleted successfully', 'success');
      } else {
        const data = await response.json();
        console.error('Error deleting post:', data.error);
        showSnackbar(`Failed to delete post: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showSnackbar('Failed to delete post. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    setShowBulkDeleteModal(false);
    
    // Delete selected posts
    let successCount = 0;
    let failCount = 0;
    
    for (const postId of selectedPosts) {
      try {
        const response = await fetch(`/api/admin/posts/${postId}`, { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to delete post ${postId}`);
        }
      } catch (error) {
        failCount++;
        console.error(`Error deleting post ${postId}:`, error);
      }
    }
    
    setSelectedPosts([]);
    await fetchPosts();
    
    if (failCount > 0) {
      showSnackbar(`Deleted ${successCount} post(s) successfully. ${failCount} post(s) failed to delete.`, 'warning');
    } else {
      showSnackbar(`Successfully deleted ${successCount} post(s).`, 'success');
    }
  };

  const handleBulkAction = async (action: 'changeStatus' | 'delete', status?: string) => {
    if (selectedPosts.length === 0) return;

    try {
      if (action === 'delete') {
        // Show confirmation dialog for bulk delete
        setShowBulkDeleteModal(true);
        return;
      } else if (action === 'changeStatus' && status) {
        // Change status of selected posts
        let successCount = 0;
        let failCount = 0;
        
        for (const postId of selectedPosts) {
          try {
            const response = await fetch(`/api/admin/posts/${postId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status }),
            });
            if (response.ok) {
              successCount++;
            } else {
              failCount++;
              const errorData = await response.json();
              console.error(`Failed to change status for post ${postId}:`, errorData);
            }
          } catch (error) {
            failCount++;
            console.error(`Error changing status for post ${postId}:`, error);
          }
        }
        
        setSelectedPosts([]);
        await fetchPosts();
        
        if (failCount > 0) {
          showSnackbar(`Changed status to ${status.charAt(0).toUpperCase() + status.slice(1)} for ${successCount} post(s) successfully. ${failCount} post(s) failed to update.`, 'warning');
        } else {
          showSnackbar(`Successfully changed status to ${status.charAt(0).toUpperCase() + status.slice(1)} for ${successCount} post(s).`, 'success');
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showSnackbar('An error occurred while performing the bulk action. Please try again.', 'error');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      review: 'warning',
      scheduled: 'info',
      published: 'success',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 ml-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">All Posts</h1>
            <Badge variant="outline" className="text-xs">
              {currentRole.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Manage your blog posts and articles
          </p>
        </div>
        {permissions.includes('post:create') && (
          <Button onClick={() => router.push('/layout-1/blog/posts/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Author</label>
              <Input
                placeholder="Filter by author..."
                value={filters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedPosts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedPosts.length} post(s) selected
              </span>
              <div className="flex gap-2">
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value === 'draft' || value === 'review' || value === 'published') {
                      handleBulkAction('changeStatus', value);
                    }
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <CardDescription>
            Manage your blog posts and articles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No posts found</h3>
                <p className="text-sm">
                  {filters.search || filters.status !== 'all' || filters.author || filters.dateFrom || filters.dateTo
                    ? 'Try adjusting your filters to see more results.'
                    : 'Get started by creating your first post.'
                  }
                </p>
              </div>
              {permissions.includes('post:create') && (
                <Button onClick={() => router.push('/layout-1/blog/posts/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">
                      <input
                        type="checkbox"
                        checked={selectedPosts.length === posts.length && posts.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-input"
                      />
                    </th>
                    <th className="text-left p-4 font-medium">Thumbnail</th>
                    <th className="text-left p-4 font-medium">Title</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Author</th>
                    <th className="text-left p-4 font-medium">Updated</th>
                    <th className="text-left p-4 font-medium">Tags</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(post.id)}
                          onChange={(e) => handleSelectPost(post.id, e.target.checked)}
                          className="rounded border-input"
                        />
                      </td>
                      <td className="p-4">
                        {post.featuredImage ? (
                          <div className="w-16 h-12 rounded-md overflow-hidden bg-muted">
                            <img
                              src={post.featuredImage}
                              alt={post.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{post.title}</div>
                          <div className="text-sm text-muted-foreground">
                            /{post.slug}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="p-4 text-sm">{post.author}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(post.updatedAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {permissions.includes('post:edit') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/layout-1/blog/posts/${post.id}/edit`, '_blank')}
                            title="Edit post"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/preview/post/${post.id}`, '_blank')}
                            title="Preview post"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {permissions.includes('post:delete') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletePostId(post.id);
                                setShowDeleteModal(true);
                              }}
                              title="Delete post"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > filters.limit && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((filters.page - 1) * filters.limit) + 1} to{' '}
                {Math.min(filters.page * filters.limit, total)} of {total} posts
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page * filters.limit >= total}
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletePostId(null);
        }}
        onConfirm={() => deletePostId && handleDeletePost(deletePostId)}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={isDeleting}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationDialog
        open={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Multiple Posts"
        description={`Are you sure you want to delete ${selectedPosts.length} post(s)? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
