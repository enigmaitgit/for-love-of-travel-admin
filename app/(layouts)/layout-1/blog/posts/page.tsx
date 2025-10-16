'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Filter, Edit, Eye, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useSnackbar } from '@/components/ui/snackbar';
import { getCurrentUserPermissions, getSessionRole } from '@/lib/rbac';
import { Post } from '@/lib/api-client';
import { PostSearch } from '@/lib/validation';
import { resolveImageUrl } from '@/lib/resolveImage';

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
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadingPostId, setUploadingPostId] = React.useState<string | null>(null);
  
  // Filters - memoized to prevent infinite re-renders
  const filters = React.useMemo(() => ({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as 'all' | 'draft' | 'published' | 'review' | 'scheduled') || 'all', // Show both review and published by default
    author: searchParams.get('author') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
  }), [searchParams]);

  const [filtersState, setFiltersState] = React.useState<PostSearch>(filters);

  const permissions = getCurrentUserPermissions();
  const currentRole = getSessionRole();
  
  // Helper function to check if post ID is valid
  const isValidPostId = (postId: unknown): boolean => {
    if (!postId) return false;
    const idStr = String(postId).trim();
    return idStr !== '' && idStr !== 'undefined' && idStr !== 'null' && idStr.length >= 24;
  };
  
  // Show buttons for valid post IDs
  const shouldShowButtons = (postId: unknown): boolean => {
    return isValidPostId(postId);
  };

  // Fetch posts
  const fetchPosts = React.useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filtersState).forEach(([key, value]) => {
        if (value) {
          if (key === 'status' && value === 'all') {
            // For "all" status, send both review and published
            queryParams.set('status', 'review,published');
          } else {
            queryParams.set(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/admin/posts?${queryParams}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('📋 Posts fetched successfully:', {
          total: data.total,
          rowsCount: data.rows?.length || 0,
          firstPost: data.rows?.[0] ? {
            id: data.rows[0].id,
            _id: data.rows[0]._id,
            idType: typeof data.rows[0].id,
            title: data.rows[0].title,
            hasId: !!data.rows[0].id,
            hasUnderscoreId: !!data.rows[0]._id
          } : null
        });
        
        setPosts(data.rows);
        setTotal(data.total);
      } else {
        console.error('Error fetching posts:', data.error);
        // Set empty state on error
        setPosts([]);
        setTotal(0);
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
      // Only reset to first page when filters other than page change
      page: key === 'page' ? value as number : 1,
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
    setSelectedPosts(checked && posts ? posts.map(post => post.id) : []);
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

  const handleBulkAction = async (action: 'changeStatus' | 'delete' | 'uploadToMain', status?: string) => {
    if (selectedPosts.length === 0) return;

    try {
      if (action === 'delete') {
        // Show confirmation dialog for bulk delete
        setShowBulkDeleteModal(true);
        return;
      } else if (action === 'uploadToMain') {
        // Upload selected posts to main website and update status to published
        setIsUploading(true);
        let successCount = 0;
        let failCount = 0;
        let statusUpdateFailCount = 0;
        
        for (const postId of selectedPosts) {
          try {
            // First, upload to main website
            const uploadResponse = await fetch(`/api/admin/posts/${postId}/upload-to-main`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            
            if (uploadResponse.ok) {
              // If upload is successful, update the post status to published
              const statusResponse = await fetch(`/api/admin/posts/${postId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'published' }),
              });
              
              if (statusResponse.ok) {
                successCount++;
              } else {
                statusUpdateFailCount++;
                console.error(`Failed to update status for post ${postId}:`, await statusResponse.json().catch(() => ({})));
              }
            } else {
              failCount++;
              const errorData = await uploadResponse.json();
              console.error(`Failed to upload post ${postId} to main website:`, errorData);
            }
          } catch (error) {
            failCount++;
            console.error(`Error uploading post ${postId} to main website:`, error);
          }
        }
        
        setSelectedPosts([]);
        await fetchPosts();
        setIsUploading(false);
        
        if (failCount > 0 || statusUpdateFailCount > 0) {
          let message = `Uploaded ${successCount} post(s) to main website successfully.`;
          if (failCount > 0) {
            message += ` ${failCount} post(s) failed to upload.`;
          }
          if (statusUpdateFailCount > 0) {
            message += ` ${statusUpdateFailCount} post(s) uploaded but failed to update status to published.`;
          }
          showSnackbar(message, 'warning');
        } else {
          showSnackbar(`Successfully uploaded ${successCount} post(s) to main website and updated status to published!`, 'success');
        }
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

  const handleUploadToMain = async (postId: string) => {
    setIsUploading(true);
    setUploadingPostId(postId);
    
    try {
      // First, upload to main website
      const uploadResponse = await fetch(`/api/admin/posts/${postId}/upload-to-main`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (uploadResponse.ok) {
        // If upload is successful, update the post status to published
        const statusResponse = await fetch(`/api/admin/posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' }),
        });
        
        if (statusResponse.ok) {
          showSnackbar('Post uploaded to main website and status updated to published!', 'success');
        } else {
          showSnackbar('Post uploaded to main website, but failed to update status to published.', 'warning');
        }
        
        await fetchPosts(); // Refresh the list
      } else {
        const data = await uploadResponse.json();
        console.error('Error uploading post to main website:', data.error);
        showSnackbar(`Failed to upload post: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error uploading post to main website:', error);
      showSnackbar('Failed to upload post to main website. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      setUploadingPostId(null);
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
            <h1 className="text-2xl font-bold">Published & Review Posts</h1>
            <Badge variant="outline" className="text-xs">
              {currentRole.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Manage your published and review status posts (draft posts are managed separately)
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
                  <SelectItem value="all">All (Review & Published)</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
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
                    if (value === 'review' || value === 'published') {
                      handleBulkAction('changeStatus', value);
                    } else if (value === 'uploadToMain') {
                      handleBulkAction('uploadToMain');
                    }
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Bulk Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="review">Change to Review</SelectItem>
                    <SelectItem value="published">Change to Published</SelectItem>
                    <SelectItem value="uploadToMain">Upload to Main Website</SelectItem>
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
          <CardTitle>Published & Review Posts</CardTitle>
          <CardDescription>
            Manage your published and review status posts (draft posts are managed separately)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!posts || posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No published or review posts found</h3>
                <p className="text-sm">
                  {filters.search || filters.author || filters.dateFrom || filters.dateTo
                    ? 'Try adjusting your filters to see more results.'
                    : 'No published or review posts found. Draft posts are managed separately.'
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
                        checked={posts && selectedPosts.length === posts.length && posts.length > 0}
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
                    <th className="text-left p-4 font-medium">Categories</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts && posts.map((post, index) => (
                    <tr key={post.id || `post-${index}`} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(post.id)}
                          onChange={(e) => handleSelectPost(post.id, e.target.checked)}
                          className="rounded border-input"
                        />
                      </td>
                      <td className="p-4">
                        {(() => {
                          // Check for featuredMedia first, then fallback to featuredImage
                          const rawMediaUrl = post.featuredMedia?.url || 
                            (typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage?.url);
                          const mediaType = post.featuredMedia?.type || 'image';
                          
                          // Resolve the URL properly
                          const mediaUrl = rawMediaUrl ? resolveImageUrl(rawMediaUrl) : null;
                          
                          // Debug logging for video posts
                          if (mediaType === 'video' && post.title === 'Checking the video upload') {
                            console.log('Video post debug:', {
                              title: post.title,
                              rawMediaUrl,
                              resolvedMediaUrl: mediaUrl,
                              featuredMedia: post.featuredMedia
                            });
                          }
                          
                          return mediaUrl && mediaUrl.trim() !== '' ? (
                            <div className="w-16 h-12 rounded-md overflow-hidden bg-muted relative">
                              {mediaType === 'video' ? (
                                <div className="relative w-full h-full bg-black">
                                  <video
                                    src={mediaUrl}
                                    className="w-full h-full object-cover"
                                    controls={false}
                                    muted
                                    preload="metadata"
                                    onError={(e) => {
                                      console.error('Video thumbnail failed to load:', {
                                        title: post.title,
                                        videoUrl: mediaUrl,
                                        rawUrl: rawMediaUrl,
                                        featuredMedia: post.featuredMedia
                                      });
                                      const target = e.target as HTMLVideoElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `
                                          <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                                            <div class="text-center">
                                              <div class="w-4 h-4 mx-auto mb-1 bg-gray-600 rounded-full flex items-center justify-center">
                                                <div class="w-0 h-0 border-l-[4px] border-l-white border-y-[3px] border-y-transparent ml-0.5"></div>
                                              </div>
                                              <div class="text-xs text-gray-600">Video</div>
                                            </div>
                                          </div>
                                        `;
                                      }
                                    }}
                                  />
                                  {/* Video badge */}
                                  <div className="absolute top-1 right-1">
                                    <div className="bg-black/70 text-white text-xs px-1 py-0.5 rounded flex items-center gap-1">
                                      <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center">
                                        <div className="w-0 h-0 border-l-[2px] border-l-black border-y-[1px] border-y-transparent"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={mediaUrl}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>';
                                  }}
                                />
                              )}
                            </div>
                          ) : (
                            <div className="w-16 h-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
                              No Media
                            </div>
                          );
                        })()}
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
                      <td className="p-4 text-sm">
                        {post.author || 'Unknown'}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(post.updatedAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {post.tags && post.tags.length > 0 ? (
                            <>
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
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">No tags</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {post.categories && post.categories.length > 0 ? (
                            post.categories.slice(0, 2).map((category, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {typeof category === 'string' ? category : category.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No categories</span>
                          )}
                          {post.categories && post.categories.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{post.categories.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {permissions.includes('post:edit') && shouldShowButtons(post.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/layout-1/blog/posts/${String(post.id)}/edit`, '_blank')}
                            title="Edit post"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          )}
                          {shouldShowButtons(post.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/preview/post/${String(post.id)}`, '_blank')}
                            title="Preview post"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          )}
                          {permissions.includes('post:publish') && shouldShowButtons(post.id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUploadToMain(post.id)}
                              disabled={isUploading && uploadingPostId === post.id}
                              title="Upload to main website"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.includes('post:delete') && shouldShowButtons(post.id) && (
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
      {total > filtersState.limit && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((filtersState.page - 1) * filtersState.limit) + 1} to{' '}
                {Math.min(filtersState.page * filtersState.limit, total)} of {total} posts
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filtersState.page === 1}
                  onClick={() => handleFilterChange('page', filtersState.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filtersState.page * filtersState.limit >= total}
                  onClick={() => handleFilterChange('page', filtersState.page + 1)}
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
