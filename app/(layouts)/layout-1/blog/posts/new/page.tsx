'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Eye, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/cms/RichTextEditor';
import { ContentBuilder } from '@/components/cms/ContentBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostDraftSchema } from '@/lib/validation';
import { z } from 'zod';
import { getCurrentUserPermissions } from '@/lib/rbac';
import { MediaLibrary } from '@/components/cms/MediaLibrary';
import { MediaAsset } from '@/lib/api-client';
import { ContentSection } from '@/lib/validation';
import { useSnackbar } from '@/components/ui/snackbar';
import { useDebouncedAutosave } from '@/hooks/useDebouncedAutosave';
import { CategorySelector } from '@/components/admin/CategorySelector';
import { getApiUrl } from '@/lib/api-config';

// Use the enhanced PostDraftSchema that includes contentSections
type PostDraft = z.infer<typeof PostDraftSchema>;

export default function NewPostPage() {
  const router = useRouter();
  const permissions = getCurrentUserPermissions();
  const { showSnackbar } = useSnackbar();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [postId, setPostId] = React.useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('draft:new-post');
    }
    return null;
  });
  
  // Validate postId from localStorage on mount
  React.useEffect(() => {
    const validatePostId = async () => {
      if (postId) {
        try {
          const response = await fetch(getApiUrl(`admin/posts/${postId}`));
          if (!response.ok) {
            // Post doesn't exist, clear the postId
            console.log('Post from localStorage no longer exists, clearing postId');
            setPostId(null);
            localStorage.removeItem('draft:new-post');
          }
        } catch (error) {
          console.error('Error validating postId:', error);
          setPostId(null);
          localStorage.removeItem('draft:new-post');
        }
      }
    };
    
    validatePostId();
  }, []);
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<MediaAsset | null>(null);
  const [contentSections, setContentSections] = React.useState<ContentSection[]>([]);
  const [tagInput, setTagInput] = React.useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [isAutoSaving, setIsAutoSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  const form = useForm<PostDraft>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(PostDraftSchema) as any,
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
      breadcrumb: {
        enabled: true,
        items: [
          { label: 'Home', href: '/' },
          { label: 'Destinations', href: '#destinations' }
        ]
      },
      readingTime: 0,
      jsonLd: false,
    },
  });

  const { watch, setValue, formState: { errors } } = form;
  const watchedValues = watch();

  // Create draft object for autosave
  const draft = React.useMemo(() => ({
    ...watchedValues,
    contentSections: contentSections,
    status: 'review'
  }), [watchedValues, contentSections]);

  // Use debounced autosave hook
  useDebouncedAutosave({
    draft,
    postId,
    setPostId,
    delay: 3000, // Increased delay to reduce request frequency
    onSave: (id) => {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setIsAutoSaving(false);
    },
    onError: (error) => {
      console.error('Autosave error:', error);
      setIsAutoSaving(false);
    }
  });



  // Handle content sections changes
  const handleContentSectionsChange = (newSections: ContentSection[]) => {
    setContentSections(newSections);
    setValue('contentSections', newSections);
    setHasUnsavedChanges(true);
  };



  // Auto-generate slug from title
  React.useEffect(() => {
    if (watchedValues.title && !watchedValues.slug) {
      const slug = watchedValues.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [watchedValues.title, watchedValues.slug, setValue]);

  const handleSaveDraft = async (data: PostDraft) => {
    if (!permissions.includes('post:create')) {
      showSnackbar('You do not have permission to create posts', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestBody = {
        ...data,
        contentSections: contentSections,
        status: 'draft' // Explicitly set status to draft
      };
      
      console.log('Save Draft - Request body:', requestBody);
      console.log('Tags in request body:', requestBody.tags);
      console.log('Categories in request body:', requestBody.categories);
      
      let response;
      if (postId) {
        // Update existing draft
        response = await fetch(`/api/admin/posts/${postId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      } else {
        // Create new draft
        response = await fetch('/api/admin/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      }

      if (response.ok) {
        const result = await response.json();
        if (result.id || result.data?.id) {
          const newPostId = result.id || result.data.id;
          setPostId(newPostId);
          localStorage.setItem('draft:new-post', newPostId);
        }
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        showSnackbar('Post saved as draft successfully!', 'success');
      } else {
        let errorMessage = 'Failed to save draft. Please try again.';
        try {
          const errorData = await response.json();
          console.error('Error saving draft - Status:', response.status);
          console.error('Error saving draft - Response:', errorData);
          
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
            errorMessage = `Validation error: ${errorData.validationErrors.map((err: any) => err.msg || err.message).join(', ')}`;
          } else if (Array.isArray(errorData) && errorData.length > 0) {
            errorMessage = errorData[0].msg || errorData[0].message || 'Validation error';
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
        
        showSnackbar(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      showSnackbar('Failed to save draft. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (data: PostDraft) => {
    if (!postId) {
      showSnackbar('Please wait for autosave to create a draft first', 'warning');
      return;
    }

    // Validate required fields before publishing
    if (!data.title || data.title.trim().length === 0) {
      showSnackbar('Title is required for publishing', 'error');
      return;
    }

    // Check if there's enough content (either body or content sections)
    const hasBodyContent = data.body && data.body.replace(/<[^>]*>/g, '').trim().length >= 50;
    const hasContentSections = contentSections && contentSections.length > 0;
    
    if (!hasBodyContent && !hasContentSections) {
      showSnackbar('Post must have at least 50 characters of content or content sections to publish', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const publishData = {
        title: data.title.trim(),
        body: data.body || '',
        contentSections: contentSections,
        tags: data.tags.length > 0 ? data.tags : [],
        categories: data.categories || [],
      };

      const response = await fetch(getApiUrl(`admin/posts/${postId}/publish/test`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishData),
      });

      if (response.ok) {
        const result = await response.json();
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        showSnackbar('Post published successfully!', 'success');
        // Clear localStorage and navigate
        localStorage.removeItem('draft:new-post');
        router.push('/layout-1/blog/posts');
      } else {
        let errorMessage = 'Unknown error occurred';
        let errorDetails = '';
        try {
          const error = await response.json();
          console.error('Error publishing post:', error);
          
          if (response.status === 429) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
          } else if (error.error) {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          // Handle validation errors specifically
          if (error.validationErrors && Array.isArray(error.validationErrors) && error.validationErrors.length > 0) {
            const validationErrors = error.validationErrors.map((err: any) => {
              if (err.message) return err.message;
              if (err.msg) return err.msg;
              return `${err.field || err.param}: ${err.value || 'invalid'}`;
            }).join(', ');
            errorMessage = `Validation failed: ${validationErrors}`;
            errorDetails = 'Please check the highlighted fields and try again.';
          } else if (error.details && Array.isArray(error.details) && error.details.length > 0) {
            const validationErrors = error.details.map((err: any) => {
              if (err.msg) return err.msg;
              if (err.message) return err.message;
              return `${err.field || err.param}: ${err.value || 'invalid'}`;
            }).join(', ');
            errorMessage = `Validation failed: ${validationErrors}`;
            errorDetails = 'Please check the highlighted fields and try again.';
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          if (response.status === 429) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
          } else {
            errorMessage = `Server error (${response.status}). Please try again.`;
          }
        }
        
        const fullErrorMessage = errorDetails ? `${errorMessage}. ${errorDetails}` : errorMessage;
        showSnackbar(`Error publishing post: ${fullErrorMessage}`, 'error');
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      showSnackbar('Error publishing post. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleImageSelect = (asset: MediaAsset) => {
    console.log('Image selected:', asset);
    setSelectedImage(asset);
    setValue('featuredImage', asset.url);
    setShowMediaLibrary(false);
  };

  const canPublish = permissions.includes('post:publish');

  return (
    <div className="space-y-6 ml-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Post</h1>
          <p className="text-muted-foreground">
            Create a new blog post or article
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
      </div>

      <form onSubmit={form.handleSubmit((data) => handleSaveDraft(data as PostDraft))} className="space-y-6">
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
                <CardDescription>
                  Build your content using drag-and-drop sections. Create hero sections, text blocks, galleries, and more.
                </CardDescription>
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
            {/* Title & Slug and Featured Image Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Title & Slug */}
              <Card>
                <CardHeader>
                  <CardTitle>Title & Slug</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Title <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={watchedValues.title}
                      onChange={(e) => setValue('title', e.target.value)}
                      placeholder="Enter post title"
                      className={errors.title ? 'border-destructive' : ''}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Slug <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={watchedValues.slug}
                      onChange={(e) => setValue('slug', e.target.value)}
                      placeholder="post-slug"
                      className={errors.slug ? 'border-destructive' : ''}
                    />
                    {errors.slug && (
                      <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      URL-friendly version of the title
                    </p>
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
                          onLoad={() => console.log('Featured image loaded successfully:', selectedImage.filename)}
                          onError={() => {
                            console.error('Featured image failed to load:', selectedImage.filename, selectedImage.url);
                          }}
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
                          {(selectedImage.sizeKB / 1024).toFixed(1)} MB
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
                      <p className="text-sm text-muted-foreground mb-2">
                        No featured image selected
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMediaLibrary(true)}
                      >
                        Open Media Library
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Rich Text Content - Full Width */}
            <Card>
              <CardHeader>
                <CardTitle>Rich Text Content</CardTitle>
                <CardDescription>Additional rich text content (optional if using content builder)</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="text-sm font-medium mb-2 block">Body</label>
                  <RichTextEditor
                    content={watchedValues.body}
                    onChange={(content) => setValue('body', content)}
                    placeholder="Start writing your post..."
                    className="min-h-[300px]"
                  />
                  {errors.body && (
                    <p className="text-sm text-destructive mt-1">{errors.body.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Publish and Tags & Categories - Horizontal Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Publish */}
              <Card>
                <CardHeader>
                  <CardTitle>Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value="draft" disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
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
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting || isAutoSaving}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSubmitting ? 'Saving...' : 'Save Draft'}
                      </Button>
                      
                      {canPublish && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handlePublish(watchedValues)}
                          disabled={isSubmitting || isAutoSaving}
                          className="flex-1"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Submit for Review
                        </Button>
                      )}
                    </div>
                  </div>

                  {postId && (
                    <div className="pt-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/preview/post/${postId}`, '_blank')}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags & Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags & Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tags</label>
                    <div className="flex flex-wrap gap-2 min-h-8 p-2 border border-input rounded-md bg-background">
                      {watchedValues.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = watchedValues.tags.filter((_, i) => i !== index);
                              setValue('tags', newTags);
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      <input
                        type="text"
                        placeholder="Add tags..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        className="flex-1 min-w-20 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const tag = tagInput.trim();
                            if (tag && !watchedValues.tags.includes(tag)) {
                              const newTags = [...watchedValues.tags, tag];
                              setValue('tags', newTags);
                              setTagInput('');
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Categories</label>
                    <CategorySelector
                      selectedCategories={watchedValues.categories}
                      onCategoriesChange={(categories) => setValue('categories', categories)}
                      placeholder="Select categories..."
                      maxSelections={5}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Search engine optimization settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">SEO Title</label>
                  <Input
                    value={watchedValues.seoTitle}
                    onChange={(e) => setValue('seoTitle', e.target.value)}
                    placeholder="Enter SEO title (optional)"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {watchedValues.seoTitle?.length || 0}/60 characters
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Meta Description</label>
                  <Textarea
                    value={watchedValues.metaDescription}
                    onChange={(e) => setValue('metaDescription', e.target.value)}
                    placeholder="Enter meta description (optional)"
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {watchedValues.metaDescription?.length || 0}/160 characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Additional post configuration options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">JSON-LD Schema</label>
                    <p className="text-xs text-muted-foreground">
                      Enable structured data for better SEO
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={watchedValues.jsonLd}
                    onChange={(e) => setValue('jsonLd', e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
