'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Edit, Trash2, Eye, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSnackbar } from '@/components/ui/snackbar';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface SimplePost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  featuredImage: {
    url: string;
    alt?: string;
    caption?: string;
  };
  tags: string[];
  categories: Array<{
    _id: string;
    name: string;
    slug: string;
    color: string;
  }>;
  status: 'draft' | 'review' | 'published' | 'archived';
  author: {
    _id: string;
    fullname: string;
    email: string;
    avatar?: string;
  };
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    views: number;
    likes: number;
    shares: number;
  };
  readingTime: number;
}

export default function SimplePostsPage() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  
  const [posts, setPosts] = React.useState<SimplePost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalPosts, setTotalPosts] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadingPostId, setUploadingPostId] = React.useState<string | null>(null);
  const [selectedPosts, setSelectedPosts] = React.useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deletePostId, setDeletePostId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = React.useState(false);

  // Fetch posts
  const fetchPosts = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/simple-posts?${params}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.data || []);
        setTotalPages(data.pages || 1);
        setTotalPosts(data.total || 0);
      } else {
        showSnackbar('Failed to fetch simple posts', 'error');
      }
    } catch (error) {
      console.error('Error fetching simple posts:', error);
      showSnackbar('Failed to fetch simple posts', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, showSnackbar]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle search
  const _handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/simple-posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showSnackbar('Simple post deleted successfully', 'success');
        setShowDeleteModal(false);
        setDeletePostId(null);
        fetchPosts();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || 'Failed to delete simple post', 'error');
      }
    } catch (error) {
      console.error('Error deleting simple post:', error);
      showSnackbar('Failed to delete simple post', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle bulk delete
  const handleBulkDeleteConfirm = async () => {
    setShowBulkDeleteModal(false);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const postId of selectedPosts) {
      try {
        const response = await fetch(`/api/admin/simple-posts/${postId}`, { 
          method: 'DELETE',
        });
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to delete simple post ${postId}`);
        }
      } catch (error) {
        failCount++;
        console.error(`Error deleting simple post ${postId}:`, error);
      }
    }
    
    setSelectedPosts([]);
    await fetchPosts();
    
    if (failCount > 0) {
      showSnackbar(`Deleted ${successCount} simple post(s) successfully. ${failCount} simple post(s) failed to delete.`, 'warning');
    } else {
      showSnackbar(`Successfully deleted ${successCount} simple post(s).`, 'success');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'changeStatus' | 'delete', status?: string) => {
    if (selectedPosts.length === 0) return;

    try {
      if (action === 'delete') {
        setShowBulkDeleteModal(true);
        return;
      } else if (action === 'changeStatus' && status) {
        let successCount = 0;
        let failCount = 0;
        
        for (const postId of selectedPosts) {
          try {
            const response = await fetch(`/api/admin/simple-posts/${postId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status }),
            });
            if (response.ok) {
              successCount++;
            } else {
              failCount++;
              const errorData = await response.json();
              console.error(`Failed to change status for simple post ${postId}:`, errorData);
            }
          } catch (error) {
            failCount++;
            console.error(`Error changing status for simple post ${postId}:`, error);
          }
        }
        
        setSelectedPosts([]);
        await fetchPosts();
        
        if (failCount > 0) {
          showSnackbar(`Changed status to ${status.charAt(0).toUpperCase() + status.slice(1)} for ${successCount} simple post(s) successfully. ${failCount} simple post(s) failed to update.`, 'warning');
        } else {
          showSnackbar(`Successfully changed status to ${status.charAt(0).toUpperCase() + status.slice(1)} for ${successCount} simple post(s).`, 'success');
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showSnackbar('An error occurred while performing the bulk action. Please try again.', 'error');
    }
  };

  // Handle select post
  const handleSelectPost = (postId: string, checked: boolean) => {
    setSelectedPosts(prev => 
      checked 
        ? [...prev, postId]
        : prev.filter(id => id !== postId)
    );
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectedPosts(checked && posts ? posts.map(post => post._id) : []);
  };

  const handleUploadToMain = async (postId: string) => {
    setIsUploading(true);
    setUploadingPostId(postId);
    
    try {
      // First, upload to main website
      const uploadResponse = await fetch(`/api/admin/simple-posts/${postId}/upload-to-main`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (uploadResponse.ok) {
        // Then update status to published
        const statusResponse = await fetch(`/api/admin/simple-posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' }),
        });
        
        if (statusResponse.ok) {
          showSnackbar('Simple post uploaded to main website and status updated to published!', 'success');
        } else {
          showSnackbar('Simple post uploaded to main website, but failed to update status to published.', 'warning');
        }
        
        await fetchPosts(); // Refresh the list
      } else {
        const data = await uploadResponse.json();
        console.error('Error uploading simple post to main website:', data.error);
        showSnackbar(`Failed to upload simple post: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error uploading simple post to main website:', error);
      showSnackbar('Failed to upload simple post to main website. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      setUploadingPostId(null);
    }
  };

  // Handle status change
  const _handleStatusChange = async (postId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/simple-posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        showSnackbar('Simple post status updated successfully', 'success');
        fetchPosts();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || 'Failed to update simple post status', 'error');
      }
    } catch (error) {
      console.error('Error updating simple post status:', error);
      showSnackbar('Failed to update simple post status', 'error');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge with proper colors
  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      review: 'warning',
      published: 'success',
      archived: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 ml-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Simple Posts</h1>
          <p className="text-muted-foreground">
            Manage your simple posts - quick posts with just an image and content
          </p>
        </div>
        <Button onClick={() => router.push('/layout-1/blog/simple-posts/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Simple Post
        </Button>
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
                  placeholder="Search simple posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Author</label>
              <Input
                placeholder="Filter by author..."
                disabled
                className="text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  disabled
                  className="flex-1 text-muted-foreground"
                />
                <Input
                  type="date"
                  disabled
                  className="flex-1 text-muted-foreground"
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
                {selectedPosts.length} simple post(s) selected
              </span>
              <div className="flex gap-2">
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value === 'draft' || value === 'published' || value === 'archived') {
                      handleBulkAction('changeStatus', value);
                    }
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Bulk Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Change to Draft</SelectItem>
                    <SelectItem value="published">Change to Published</SelectItem>
                    <SelectItem value="archived">Change to Archived</SelectItem>
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
          <CardTitle>Simple Posts</CardTitle>
          <CardDescription>
            Manage your simple posts - quick posts with just an image and content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading simple posts...</div>
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No simple posts found</h3>
                <p className="text-sm">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by creating your first simple post.'
                  }
                </p>
              </div>
              <Button onClick={() => router.push('/layout-1/blog/simple-posts/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Simple Post
              </Button>
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
                    <tr key={post._id || `post-${index}`} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(post._id)}
                          onChange={(e) => handleSelectPost(post._id, e.target.checked)}
                          className="rounded border-input"
                        />
                      </td>
                      <td className="p-4">
                        {post.featuredImage?.url ? (
                          <div className="w-16 h-12 rounded-md overflow-hidden bg-muted relative">
                            <img
                              src={post.featuredImage.url}
                              alt={post.featuredImage.alt || post.title}
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
                      <td className="p-4 text-sm">
                        {post.author?.fullname || 'Unknown'}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(post.publishedAt || post.createdAt)}
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
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs"
                                style={{ borderColor: category.color, color: category.color }}
                              >
                                {category.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No categories</span>
                          )}
                          {post.categories && post.categories.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.categories.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/layout-1/blog/simple-posts/${post._id}/edit`)}
                            title="Edit simple post"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/preview/simple-post/${post._id}`, '_blank')}
                            title="View simple post"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUploadToMain(post._id)}
                            disabled={isUploading && uploadingPostId === post._id}
                            title="Upload to main website"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletePostId(post._id);
                              setShowDeleteModal(true);
                            }}
                            title="Delete simple post"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * 10) + 1} to{' '}
                {Math.min(currentPage * 10, totalPosts)} of {totalPosts} simple posts
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Simple Posts Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalPosts}</div>
              <div className="text-sm text-muted-foreground">Total Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {posts.filter(p => p.status === 'published').length}
              </div>
              <div className="text-sm text-muted-foreground">Published</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {posts.filter(p => p.status === 'draft').length}
              </div>
              <div className="text-sm text-muted-foreground">Drafts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {posts.filter(p => p.status === 'review').length}
              </div>
              <div className="text-sm text-muted-foreground">In Review</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {posts.reduce((sum, p) => sum + p.stats.views, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletePostId(null);
        }}
        onConfirm={() => deletePostId && handleDeletePost(deletePostId)}
        title="Delete Simple Post"
        description="Are you sure you want to delete this simple post? This action cannot be undone."
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
        title="Delete Multiple Simple Posts"
        description={`Are you sure you want to delete ${selectedPosts.length} simple post(s)? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
