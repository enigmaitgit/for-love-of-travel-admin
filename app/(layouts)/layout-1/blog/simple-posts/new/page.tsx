'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Eye, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';
import { getCurrentUserPermissions } from '@/lib/rbac';
import { MediaLibrary } from '@/components/cms/MediaLibrary';
import { FeaturedMediaSelector } from '@/components/cms/FeaturedMediaSelector';
import { RichTextEditor } from '@/components/cms/RichTextEditor';
import { MediaAsset } from '@/lib/api';
import { useSnackbar } from '@/components/ui/snackbar';
import { useSimplePostAutosave } from '@/hooks/useSimplePostAutosave';
import { CategorySelector } from '@/components/admin/CategorySelector';
import { TagSelector } from '@/components/admin/TagSelector';

// Simple post validation schema
const SimplePostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content must be less than 10000 characters'),
  featuredImage: z.object({
    url: z.string().min(1, 'Featured image URL is required'),
    alt: z.string().optional(),
    caption: z.string().optional()
  }),
  tags: z.array(z.string()).min(0),
  categories: z.array(z.string()).min(0),
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.enum(['draft', 'review', 'published', 'archived'])
});

type SimplePost = z.infer<typeof SimplePostSchema>;

export default function NewSimplePostPage() {
  const router = useRouter();
  const permissions = getCurrentUserPermissions();
  const { showSnackbar } = useSnackbar();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [postId, setPostId] = React.useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      // Clear any existing draft from localStorage to start fresh
      localStorage.removeItem('draft:new-simple-post');
      return null;
    }
    return null;
  });
  
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [selectedFeaturedMedia, setSelectedFeaturedMedia] = React.useState<MediaAsset | null>(null);
  const [, setHasUnsavedChanges] = React.useState(false);
  const [, setIsAutoSaving] = React.useState(false);
  const [, setLastSaved] = React.useState<Date | null>(null);

  const form = useForm<SimplePost>({
    resolver: zodResolver(SimplePostSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      featuredImage: {
        url: '',
        alt: '',
        caption: ''
      },
      tags: [],
      categories: [],
      seoTitle: '',
      metaDescription: '',
      status: 'draft'
    },
  });

  // Reset form state when component mounts to ensure clean slate
  React.useEffect(() => {
    console.log('NewSimplePostPage: Resetting form state for new simple post creation');
    form.reset({
      title: '',
      slug: '',
      content: '',
      featuredImage: {
        url: '',
        alt: '',
        caption: ''
      },
      tags: [],
      categories: [],
      seoTitle: '',
      metaDescription: '',
      status: 'draft'
    });
    setSelectedFeaturedMedia(null);
    setHasUnsavedChanges(false);
    setLastSaved(null);
  }, [form]);

  const { watch, setValue, formState: { errors } } = form;
  const watchedValues = watch();
  

  // Create draft object for autosave
  const draft = React.useMemo(() => ({
    ...watchedValues,
    status: 'draft' as const
  }), [watchedValues]);

  // Use simple post autosave hook
  const { isAutoSaving: autoSaving, lastSaved: autoLastSaved, hasUnsavedChanges: autoHasUnsavedChanges, saveDraftManually } = useSimplePostAutosave({
    draft,
    postId: postId || '',
    setPostId,
    delay: 3000,
    onSave: () => {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setIsAutoSaving(false);
    },
    onError: (error) => {
      console.error('Autosave error:', error);
      setIsAutoSaving(false);
      // Show user-friendly error message
      showSnackbar(`Autosave failed: ${error}`);
    }
  });

  // Auto-generate slug from title
  React.useEffect(() => {
    if (!watchedValues.slug) {
      if (watchedValues.title && watchedValues.title.trim()) {
        const slug = watchedValues.title
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        setValue('slug', slug);
      }
    }
  }, [watchedValues.title, watchedValues.slug, setValue]);

  const handleSaveDraft = async (_data: SimplePost) => {
    if (!permissions.includes('post:create')) {
      showSnackbar('You do not have permission to create posts', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the autosave hook's manual save function
      await saveDraftManually();
      
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      showSnackbar('Simple post saved as draft successfully!', 'success');
    } catch (error) {
      console.error('Error saving simple post draft:', error);
      showSnackbar('Error saving simple post draft. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (data: SimplePost) => {
    if (!postId) {
      showSnackbar('Please wait for autosave to create a draft first', 'warning');
      return;
    }

    // Validate required fields before publishing
    if (!data.title || data.title.trim().length === 0) {
      showSnackbar('Title is required for publishing', 'error');
      return;
    }

    if (!data.content || data.content.trim().length === 0) {
      showSnackbar('Content is required for publishing', 'error');
      return;
    }

    if (!data.featuredImage.url) {
      showSnackbar('Featured image is required for publishing', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const publishData = {
        title: data.title.trim(),
        content: data.content.trim(),
        featuredImage: data.featuredImage,
        tags: data.tags.length > 0 ? data.tags : [],
        categories: data.categories || [],
      };

      const response = await fetch(`/api/admin/simple-posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...publishData,
          status: 'review'
        }),
      });

      if (response.ok) {
        await response.json();
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        showSnackbar('Simple post submitted for review successfully!', 'success');
        // Clear localStorage and navigate
        localStorage.removeItem('draft:new-simple-post');
        router.push('/layout-1/blog/simple-posts');
      } else {
        let errorMessage = 'Unknown error occurred';
        try {
          const error = await response.json();
          console.error('Error publishing simple post:', error);
          
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
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          if (response.status === 429) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
          } else {
            errorMessage = `Server error (${response.status}). Please try again.`;
          }
        }
        
        showSnackbar(`Error submitting simple post: ${errorMessage}`, 'error');
      }
    } catch (error) {
      console.error('Error publishing simple post:', error);
      showSnackbar('Error submitting simple post. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canPublish = permissions.includes('post:publish');

  return (
    <div className="space-y-6 ml-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Simple Post</h1>
          <p className="text-muted-foreground">
            Create a simple post with just an image and content
          </p>
          {/* Auto-save status indicator */}
          <div className="flex items-center space-x-4 text-sm mt-2">
            {autoSaving && (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                <span>Auto-saving...</span>
              </div>
            )}
            {autoLastSaved && !autoHasUnsavedChanges && !autoSaving && (
              <div className="flex items-center text-green-600">
                <span>✓</span>
                <span className="ml-1">Saved {autoLastSaved.toLocaleTimeString()}</span>
              </div>
            )}
            {autoHasUnsavedChanges && !autoSaving && (
              <div className="flex items-center text-amber-600">
                <span>•</span>
                <span className="ml-1">You have unsaved changes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit((data) => handleSaveDraft(data as SimplePost))} className="space-y-6">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6 mt-6">
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
                    setValue('featuredImage', {
                      url: media.url,
                      alt: media.altText || '',
                      caption: media.caption || ''
                    });
                  } else {
                    setValue('featuredImage', {
                      url: '',
                      alt: '',
                      caption: ''
                    });
                  }
                }}
                onRemoveMedia={() => {
                  setSelectedFeaturedMedia(null);
                  setValue('featuredImage', {
                    url: '',
                    alt: '',
                    caption: ''
                  });
                }}
              />
            </div>

            {/* Content - Full Width */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>Write your simple post content using the rich text editor</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Content <span className="text-destructive">*</span>
                  </label>
                  <RichTextEditor
                    content={watchedValues.content}
                    onChange={(content) => setValue('content', content)}
                    placeholder="Write your post content..."
                    className="min-h-[300px]"
                  />
                  <div className="flex justify-between items-center mt-2">
                    {errors.content && (
                      <p className="text-sm text-destructive">{errors.content.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground ml-auto">
                      {watchedValues.content.length}/10000 characters
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags & Categories - Horizontal Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                  <CardDescription>
                    Add tags to help categorize your post. Start typing to see suggestions from existing tags.
                  </CardDescription>
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
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    {autoSaving && (
                      <div className="flex items-center text-blue-600">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                        <span>Auto-saving...</span>
                      </div>
                    )}
                    {autoLastSaved && !autoHasUnsavedChanges && !autoSaving && (
                      <div className="flex items-center text-green-600">
                        <span>✓</span>
                        <span className="ml-1">Saved {autoLastSaved.toLocaleTimeString()}</span>
                      </div>
                    )}
                    {autoHasUnsavedChanges && !autoSaving && (
                      <div className="flex items-center text-amber-600">
                        <span>•</span>
                        <span className="ml-1">You have unsaved changes</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting || autoSaving}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Saving...' : autoSaving ? 'Auto-saving...' : 'Save Draft'}
                    </Button>
                    
                    {canPublish && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handlePublish(watchedValues)}
                        disabled={isSubmitting || autoSaving}
                        className="flex-1"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit for Review
                      </Button>
                    )}
                  </div>

                  {postId && (
                    <div className="pt-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/preview/simple-post/${postId}`, '_blank')}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                <div className="text-sm text-muted-foreground">
                  Simple posts have minimal configuration options. For advanced features, use the regular post editor.
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
        onSelect={() => {}}
        selectedAssetId={undefined}
      />
    </div>
  );
}
