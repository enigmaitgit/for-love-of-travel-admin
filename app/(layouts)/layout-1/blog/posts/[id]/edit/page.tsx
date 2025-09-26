'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/cms/RichTextEditor';
import { ContentBuilder } from '@/components/cms/ContentBuilder';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Save, Eye, Image as ImageIcon, Trash2 } from 'lucide-react';
import { getCurrentUserPermissions } from '@/lib/rbac';
import { Post } from '@/lib/api';
import { MediaLibrary } from '@/components/cms/MediaLibrary';
import { MediaAsset } from '@/lib/api';
import { ContentSection, PostDraftSchema } from '@/lib/validation';
import { useSnackbar } from '@/components/ui/snackbar';

// Use the same schema as new post to include contentSections
const EditPostFormSchema = PostDraftSchema.extend({
  status: z.enum(['draft', 'review', 'published']).optional(),
});

type PostFormData = z.infer<typeof EditPostFormSchema>;

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { showSnackbar } = useSnackbar();
  
  const [post, setPost] = React.useState<Post | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<MediaAsset | null>(null);
  const [contentSections, setContentSections] = React.useState<ContentSection[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [isAutoSaving, setIsAutoSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  
  const permissions = getCurrentUserPermissions();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(EditPostFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      body: '',
      contentSections: [],
      tags: [],
      categories: [],
      featuredImage: '',
      seoTitle: '',
      metaDescription: '',
      jsonLd: false,
      breadcrumb: {
        enabled: true,
        items: [
          { label: 'Home', href: '/' },
          { label: 'Destinations', href: '#destinations' }
        ]
      },
      readingTime: 0,
    },
  });

  const watchedValues = watch();

  // Auto-save for general form changes
  React.useEffect(() => {
    if (!postId || !post || isInitialLoad) return; // Don't auto-save on initial load
    
    // Set unsaved changes flag
    setHasUnsavedChanges(true);
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Auto-save after 2 seconds of inactivity
    const timeoutId = setTimeout(() => {
      autoSaveForm();
    }, 2000);
    
    setAutoSaveTimeout(timeoutId);
    
    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [watchedValues.title, watchedValues.slug, watchedValues.body, watchedValues.tags, watchedValues.categories, watchedValues.featuredImage, watchedValues.seoTitle, watchedValues.metaDescription, watchedValues.jsonLd, watchedValues.breadcrumb, watchedValues.readingTime, postId, post, isInitialLoad]);

  const autoSaveForm = async () => {
    if (!postId || isAutoSaving) return;
    
    setIsAutoSaving(true);
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...watchedValues,
          contentSections: contentSections,
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Auto-save function for content sections
  const autoSaveContentSections = async (sections: ContentSection[]) => {
    if (!postId || isAutoSaving) return;
    
    setIsAutoSaving(true);
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentSections: sections,
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Content sections auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Handle content sections changes
  const handleContentSectionsChange = (newSections: ContentSection[]) => {
    setContentSections(newSections);
    setValue('contentSections', newSections);
    setHasUnsavedChanges(true);
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Auto-save after 2 seconds of inactivity
    const timeoutId = setTimeout(() => {
      autoSaveContentSections(newSections);
    }, 2000);
    
    setAutoSaveTimeout(timeoutId);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // Fetch post data
  React.useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/admin/posts/${postId}`);
        if (response.ok) {
          const postData = await response.json();
          setPost(postData);
          
          // Populate form with existing data
          setValue('title', postData.title);
          setValue('slug', postData.slug);
          setValue('body', postData.body || '');
          setValue('contentSections', postData.contentSections || []);
          setValue('tags', postData.tags || []);
          setValue('categories', postData.categories || []);
          setValue('featuredImage', postData.featuredImage || '');
          setValue('seoTitle', postData.seoTitle || '');
          setValue('metaDescription', postData.metaDescription || '');
          setValue('jsonLd', postData.jsonLd || false);
          setValue('breadcrumb', postData.breadcrumb || {
            enabled: true,
            items: [
              { label: 'Home', href: '/' },
              { label: 'Destinations', href: '#destinations' }
            ]
          });
          setValue('readingTime', postData.readingTime || 0);
          
          // Set content sections state
          setContentSections(postData.contentSections || []);
          
          // Set featured image if exists
          if (postData.featuredImage) {
            // Create a proper MediaAsset object for existing featured image
            const isDataUrl = postData.featuredImage.startsWith('data:');
            const filename = isDataUrl ? 'Featured Image' : postData.featuredImage.split('/').pop() || 'Featured Image';
            
            setSelectedImage({
              id: 'existing-' + postId,
              url: postData.featuredImage,
              type: 'image',
              sizeKB: isDataUrl ? Math.round(postData.featuredImage.length / 1024) : 0, // Estimate size for data URLs
              filename: filename,
              uploadedAt: new Date(),
            });
          }
         } else {
           console.error('Failed to fetch post');
           router.push('/layout-1/blog/posts');
         }
       } catch (error) {
         console.error('Error fetching post:', error);
         router.push('/layout-1/blog/posts');
       } finally {
         setLoading(false);
         // Allow auto-save after initial load is complete
         setTimeout(() => {
           setIsInitialLoad(false);
         }, 1000);
       }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, setValue, router]);

  const onSubmit = async (data: PostFormData) => {
    if (!permissions.includes('post:edit')) {
      showSnackbar('You do not have permission to edit posts', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          contentSections: contentSections,
        }),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        showSnackbar('Post updated successfully!', 'success');
        // Add a small delay to ensure the update is processed
        setTimeout(() => {
          // Add timestamp to force refresh
          window.location.href = `/layout-1/blog/posts?refresh=${Date.now()}`;
        }, 100);
      } else {
        const errorData = await response.json();
        console.error('Error updating post:', errorData.error);
        showSnackbar('Failed to update post. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      showSnackbar('Failed to update post. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (asset: MediaAsset) => {
    setSelectedImage(asset);
    setValue('featuredImage', asset.url);
    setShowMediaLibrary(false);
  };

  const handlePreview = () => {
    if (post) {
      window.open(`/preview/post/${post.id}`, '_blank');
    }
  };

  const canPublish = permissions.includes('post:publish');
  const canDelete = permissions.includes('post:delete');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading post...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Post not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 ml-6">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold">Edit Post</h1>
           <p className="text-muted-foreground">
             Update your blog post or article
           </p>
           {/* Auto-save status indicator */}
           <div className="flex items-center space-x-4 text-sm mt-2">
             {isAutoSaving && (
               <div className="flex items-center text-blue-600">
                 <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                 <span>Auto-saving...</span>
               </div>
             )}
             {lastSaved && !hasUnsavedChanges && !isAutoSaving && (
               <div className="flex items-center text-green-600">
                 <span>✓</span>
                 <span className="ml-1">Saved {lastSaved.toLocaleTimeString()}</span>
               </div>
             )}
             {hasUnsavedChanges && !isAutoSaving && (
               <div className="flex items-center text-amber-600">
                 <span>•</span>
                 <span className="ml-1">You have unsaved changes</span>
               </div>
             )}
           </div>
         </div>
         <div className="flex gap-2">
           <Button variant="outline" onClick={handlePreview}>
             <Eye className="h-4 w-4 mr-2" />
             Preview
           </Button>
           <Button onClick={() => router.push('/layout-1/blog/posts')}>
             Back to Posts
           </Button>
         </div>
       </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content Builder</TabsTrigger>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Builder</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Build your content using drag-and-drop sections. Create hero sections, text blocks, galleries, and more.
                </p>
              </CardHeader>
              <CardContent>
                <ContentBuilder
                  sections={contentSections}
                  onChange={handleContentSectionsChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="basic" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
            {/* Title & Slug */}
            <Card>
              <CardHeader>
                <CardTitle>Title & Slug</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Enter post title..."
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    {...register('slug')}
                    placeholder="post-slug"
                    className={errors.slug ? 'border-red-500' : ''}
                  />
                  {errors.slug && (
                    <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="body">Body</Label>
                  <RichTextEditor
                    content={watchedValues.body}
                    onChange={(content) => setValue('body', content)}
                    placeholder="Write your post content here..."
                    className={`min-h-[300px] ${errors.body ? 'border-red-500' : ''}`}
                  />
                  {errors.body && (
                    <p className="text-sm text-red-500 mt-1">{errors.body.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Publish */}
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    defaultValue={post.status} 
                    onValueChange={(value) => setValue('status', value as 'draft' | 'review' | 'published')}
                    disabled={!canPublish}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      {canPublish && (
                        <>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date(post.updatedAt).toLocaleDateString()}
                </div>
                <div className="space-y-2">
                  <Button type="submit" disabled={saving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Update Post'}
                  </Button>
                  
                  {canDelete && (
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={saving}
                      className="w-full"
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                          try {
                            const response = await fetch(`/api/admin/posts/${postId}`, {
                              method: 'DELETE',
                            });
                            
                            if (response.ok) {
                              router.push('/layout-1/blog/posts');
                            } else {
                              alert('Failed to delete post. Please try again.');
                            }
                          } catch (error) {
                            console.error('Error deleting post:', error);
                            alert('Failed to delete post. Please try again.');
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Post
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags & Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Tags & Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {watch('tags')?.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => {
                            const currentTags = watch('tags') || [];
                            setValue('tags', currentTags.filter((_, i) => i !== index));
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = e.currentTarget.value.trim();
                        if (value) {
                          const currentTags = watch('tags') || [];
                          if (!currentTags.includes(value)) {
                            setValue('tags', [...currentTags, value]);
                          }
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {watch('categories')?.map((category, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {category}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => {
                            const currentCategories = watch('categories') || [];
                            setValue('categories', currentCategories.filter((_, i) => i !== index));
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add category and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = e.currentTarget.value.trim();
                        if (value) {
                          const currentCategories = watch('categories') || [];
                          if (!currentCategories.includes(value)) {
                            setValue('categories', [...currentCategories, value]);
                          }
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedImage ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={selectedImage.url}
                        alt={selectedImage.filename}
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setSelectedImage(null);
                          setValue('featuredImage', '');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{selectedImage.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedImage.sizeKB > 0 
                          ? `${(selectedImage.sizeKB / 1024).toFixed(1)} MB`
                          : 'Size unknown'
                        }
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMediaLibrary(true)}
                        className="w-full"
                      >
                        Change Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-md p-8 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      No featured image selected
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMediaLibrary(true)}
                    >
                      Select Image
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SEO */}
            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    {...register('seoTitle')}
                    placeholder="SEO optimized title..."
                    className={errors.seoTitle ? 'border-red-500' : ''}
                  />
                  {errors.seoTitle && (
                    <p className="text-sm text-red-500 mt-1">{errors.seoTitle.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    {...register('metaDescription')}
                    placeholder="Brief description for search engines..."
                    rows={3}
                    className={errors.metaDescription ? 'border-red-500' : ''}
                  />
                  {errors.metaDescription && (
                    <p className="text-sm text-red-500 mt-1">{errors.metaDescription.message}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="jsonLd"
                    checked={watch('jsonLd')}
                    onCheckedChange={(checked) => setValue('jsonLd', checked)}
                  />
                  <Label htmlFor="jsonLd">Enable JSON-LD structured data</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    {...register('seoTitle')}
                    placeholder="SEO optimized title..."
                    className={errors.seoTitle ? 'border-red-500' : ''}
                  />
                  {errors.seoTitle && (
                    <p className="text-sm text-red-500 mt-1">{errors.seoTitle.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    {...register('metaDescription')}
                    placeholder="Brief description for search engines..."
                    rows={3}
                    className={errors.metaDescription ? 'border-red-500' : ''}
                  />
                  {errors.metaDescription && (
                    <p className="text-sm text-red-500 mt-1">{errors.metaDescription.message}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="jsonLd"
                    checked={watch('jsonLd')}
                    onCheckedChange={(checked) => setValue('jsonLd', checked)}
                  />
                  <Label htmlFor="jsonLd">Enable JSON-LD structured data</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={post?.status || 'draft'}
                    onValueChange={(value) =>
                      setValue('status', value as PostFormData['status'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button and Status */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4 text-sm">
            {isAutoSaving && (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                <span>Auto-saving...</span>
              </div>
            )}
            {lastSaved && !hasUnsavedChanges && !isAutoSaving && (
              <div className="flex items-center text-green-600">
                <span>✓</span>
                <span className="ml-1">Saved {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
            {hasUnsavedChanges && !isAutoSaving && (
              <div className="flex items-center text-amber-600">
                <span>•</span>
                <span className="ml-1">You have unsaved changes</span>
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={saving || isAutoSaving}
            className="min-w-32"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Media Library Modal */}
      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleImageSelect}
        selectedAssetId={selectedImage?.id}
      />
    </div>
  );
}
