'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Eye, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ContentBuilder } from '@/components/cms/ContentBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostDraftSchema } from '@/lib/validation';
import { z } from 'zod';
import { getCurrentUserPermissions } from '@/lib/rbac';
import { MediaLibrary } from '@/components/cms/MediaLibrary';
import { FeaturedMediaSelector } from '@/components/cms/FeaturedMediaSelector';
import { MediaAsset } from '@/lib/api';
import { ContentSection } from '@/lib/validation';
import { useSnackbar } from '@/components/ui/snackbar';
import { useDebouncedAutosave } from '@/hooks/useDebouncedAutosave';
import { CategorySelector } from '@/components/admin/CategorySelector';
import { TagSelector } from '@/components/admin/TagSelector';
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
      // Clear any existing draft from localStorage to start fresh
      localStorage.removeItem('draft:new-post');
      return null;
    }
    return null;
  });
  
  // No need to validate postId since we always start fresh
  // This ensures each new post creation starts with a clean slate
  
  // Cleanup localStorage when component unmounts
  React.useEffect(() => {
    return () => {
      // Don't clear localStorage here as it might interfere with autosave
      // The localStorage will be cleared when starting a new post
    };
  }, []);
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<MediaAsset | null>(null);
  const [selectedFeaturedMedia, setSelectedFeaturedMedia] = React.useState<MediaAsset | null>(null);
  const [contentSections, setContentSections] = React.useState<ContentSection[]>([]);
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
      featuredMedia: undefined,
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

  // Reset form state when component mounts to ensure clean slate
  React.useEffect(() => {
    console.log('NewPostPage: Resetting form state for new post creation');
    form.reset({
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
    });
    setContentSections([]);
    setSelectedImage(null);
    setHasUnsavedChanges(false);
    setLastSaved(null);
  }, [form]);

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
    onSave: () => {
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



  // Auto-generate slug from title or create unique slug for drafts
  React.useEffect(() => {
    if (!watchedValues.slug) {
      if (watchedValues.title && watchedValues.title.trim()) {
        // Generate slug from title
        const slug = watchedValues.title
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        setValue('slug', slug);
      } else if (contentSections.length > 0) {
        // Generate unique slug for untitled drafts with content
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const uniqueSlug = `draft-${timestamp}-${randomString}`;
        console.log('NewPostPage: Generating unique slug for untitled draft:', uniqueSlug);
        setValue('slug', uniqueSlug);
      }
    }
  }, [watchedValues.title, watchedValues.slug, contentSections.length, setValue]);

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
            errorMessage = `Validation error: ${errorData.validationErrors.map((err: unknown) => {
              const errorObj = err as { msg?: string; message?: string };
              return errorObj.msg || errorObj.message || 'Unknown error';
            }).join(', ')}`;
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

      const response = await fetch(`/api/admin/posts/${postId}/publish/test`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishData),
      });

      if (response.ok) {
        await response.json();
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        showSnackbar('Post submitted for review successfully!', 'success');
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
            const validationErrors = error.validationErrors.map((err: unknown) => {
              const errData = err as { message?: string; msg?: string; field?: string; param?: string; value?: string };
              if (errData.message) return errData.message;
              if (errData.msg) return errData.msg;
              return `${errData.field || errData.param}: ${errData.value || 'invalid'}`;
            }).join(', ');
            errorMessage = `Validation failed: ${validationErrors}`;
            errorDetails = 'Please check the highlighted fields and try again.';
          } else if (error.details && Array.isArray(error.details) && error.details.length > 0) {
            const validationErrors = error.details.map((err: unknown) => {
              const errData = err as { msg?: string; message?: string; field?: string; param?: string; value?: string };
              if (errData.msg) return errData.msg;
              if (errData.message) return errData.message;
              return `${errData.field || errData.param}: ${errData.value || 'invalid'}`;
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

              {/* Featured Media */}
              <FeaturedMediaSelector
                selectedMedia={selectedFeaturedMedia}
                onSelectMedia={(media) => {
                  setSelectedFeaturedMedia(media);
                  if (media) {
                    setValue('featuredMedia', {
                      url: media.url,
                      alt: media.alt || '',
                      caption: media.caption || '',
                      type: media.mimeType?.startsWith('video/') ? 'video' : 'image',
                      width: media.dimensions?.width,
                      height: media.dimensions?.height,
                      duration: media.duration
                    });
                  } else {
                    setValue('featuredMedia', undefined);
                  }
                }}
                onRemoveMedia={() => {
                  setSelectedFeaturedMedia(null);
                  setValue('featuredMedia', undefined);
                }}
              />
            </div>

            {/* Text Content - Full Width */}
            <Card>
              <CardHeader>
                <CardTitle>Text Content</CardTitle>
                <CardDescription>Additional text content (optional if using content builder)</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="text-sm font-medium mb-2 block">Body</label>
                  <Textarea
                    value={watchedValues.body}
                    onChange={(e) => setValue('body', e.target.value)}
                    placeholder="Start writing your post..."
                    rows={8}
                    className="resize-none"
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
                    <TagSelector
                      selectedTags={watchedValues.tags}
                      onTagsChange={(tags) => setValue('tags', tags)}
                      placeholder="Add tags..."
                      maxTags={10}
                    />
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
