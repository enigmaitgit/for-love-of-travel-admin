'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, Upload, Globe, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useSnackbar } from '@/components/ui/snackbar';
import { getCurrentUserPermissions, getSessionRole } from '@/lib/rbac';
import { ContentPage } from '@/lib/api-client';

export default function ContentPagesPage() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  
  const [contentPages, setContentPages] = React.useState<ContentPage[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [selectedPages, setSelectedPages] = React.useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deletePageId, setDeletePageId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncingPageId, setSyncingPageId] = React.useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = React.useState({
    search: '',
    status: 'all',
    page: 1,
    limit: 10
  });

  const permissions = getCurrentUserPermissions();
  const currentRole = getSessionRole();

  // Fetch content pages
  const fetchContentPages = React.useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') queryParams.set(key, value.toString());
      });

      const response = await fetch(`/api/v1/content-pages?${queryParams}`);
      const data = await response.json();
      
      if (response.ok) {
        setContentPages(data.data);
        setTotal(data.total);
      } else {
        console.error('Error fetching content pages:', data.error);
      }
    } catch (error) {
      console.error('Error fetching content pages:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load and when filters change
  React.useEffect(() => {
    fetchContentPages();
  }, [fetchContentPages]);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleSelectPage = (pageId: string, checked: boolean) => {
    setSelectedPages(prev => 
      checked 
        ? [...prev, pageId]
        : prev.filter(id => id !== pageId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedPages(checked ? contentPages.map(page => page.id) : []);
  };

  const handleDeletePage = async (pageId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/content-pages/${pageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        await fetchContentPages(); // Refresh the list
        setShowDeleteModal(false);
        setDeletePageId(null);
        showSnackbar('Content page deleted successfully', 'success');
      } else {
        const data = await response.json();
        console.error('Error deleting content page:', data.error);
        showSnackbar(`Failed to delete content page: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting content page:', error);
      showSnackbar('Failed to delete content page. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSyncToMain = async (pageId: string) => {
    setIsSyncing(true);
    setSyncingPageId(pageId);
    
    try {
      const response = await fetch(`/api/v1/content-pages/${pageId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        showSnackbar('Content page synced to main website successfully!', 'success');
        await fetchContentPages(); // Refresh the list
      } else {
        const data = await response.json();
        console.error('Error syncing content page:', data.error);
        showSnackbar(`Failed to sync content page: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error syncing content page:', error);
      showSnackbar('Failed to sync content page. Please try again.', 'error');
    } finally {
      setIsSyncing(false);
      setSyncingPageId(null);
    }
  };

  const handlePublishPage = async (pageId: string) => {
    try {
      const response = await fetch(`/api/v1/content-pages/${pageId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        showSnackbar('Content page published successfully!', 'success');
        await fetchContentPages(); // Refresh the list
      } else {
        const data = await response.json();
        console.error('Error publishing content page:', data.error);
        showSnackbar(`Failed to publish content page: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error publishing content page:', error);
      showSnackbar('Failed to publish content page. Please try again.', 'error');
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
        <div className="text-muted-foreground">Loading content pages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 ml-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Content Pages</h1>
            <Badge variant="outline" className="text-xs">
              {currentRole.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Manage your website content pages and sync them to the main website
          </p>
        </div>
        {permissions.includes('post:create') && (
          <Button onClick={() => router.push('/layout-1/blog/content-pages/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Content Page
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search content pages..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
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
              <label className="text-sm font-medium mb-2 block">Per Page</label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content Pages</CardTitle>
          <CardDescription>
            Manage your website content pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contentPages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No content pages found</h3>
                <p className="text-sm">
                  {filters.search || filters.status !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'Get started by creating your first content page.'
                  }
                </p>
              </div>
              {permissions.includes('post:create') && (
                <Button onClick={() => router.push('/layout-1/blog/content-pages/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Content Page
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
                        checked={selectedPages.length === contentPages.length && contentPages.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-input"
                      />
                    </th>
                    <th className="text-left p-4 font-medium">Slug</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Sections</th>
                    <th className="text-left p-4 font-medium">Last Synced</th>
                    <th className="text-left p-4 font-medium">Updated</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contentPages.map((page) => (
                    <tr key={page.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedPages.includes(page.id)}
                          onChange={(e) => handleSelectPage(page.id, e.target.checked)}
                          className="rounded border-input"
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">/{page.slug}</div>
                          {page.seoTitle && (
                            <div className="text-sm text-muted-foreground">
                              {page.seoTitle}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(page.status)}
                      </td>
                      <td className="p-4 text-sm">
                        {page.contentSections?.length || 0} sections
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {page.lastSyncedAt ? formatDate(page.lastSyncedAt) : 'Never'}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {page.updatedAt ? formatDate(page.updatedAt) : 'Never'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {permissions.includes('post:edit') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/layout-1/blog/content-pages/${page.id}/edit`)}
                              title="Edit content page"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/preview/content-page/${page.id}`, '_blank')}
                            title="Preview content page"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {permissions.includes('post:publish') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSyncToMain(page.id)}
                              disabled={isSyncing && syncingPageId === page.id}
                              title="Sync to main website"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.includes('post:publish') && page.status !== 'published' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePublishPage(page.id)}
                              title="Publish content page"
                            >
                              <Globe className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.includes('post:delete') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletePageId(page.id);
                                setShowDeleteModal(true);
                              }}
                              title="Delete content page"
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
                {Math.min(filters.page * filters.limit, total)} of {total} content pages
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
          setDeletePageId(null);
        }}
        onConfirm={() => deletePageId && handleDeletePage(deletePageId)}
        title="Delete Content Page"
        description="Are you sure you want to delete this content page? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={isDeleting}
      />
    </div>
  );
}

