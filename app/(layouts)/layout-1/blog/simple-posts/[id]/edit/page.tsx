'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Eye, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { MediaLibrary } from '@/components/cms/MediaLibrary';
import { FeaturedImageSelector } from '@/components/cms/FeaturedImageSelector';
import { FeaturedVideoSelector } from '@/components/cms/FeaturedVideoSelector';
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

export default function EditSimplePostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { showSnackbar } = useSnackbar();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [selectedFeaturedImage, setSelectedFeaturedImage] = React.useState<MediaAsset | null>(null);
  const [selectedFeaturedVideo, setSelectedFeaturedVideo] = React.useState<MediaAsset | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [isAutoSaving, setIsAutoSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

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

  const { watch, setValue, formState: { errors } } = form;
  const watchedValues = watch();
  

  // Create draft object for autosave
  const draft = React.useMemo(() => ({
    title: watchedValues.title || '',
    slug: watchedValues.slug || '',
    content: watchedValues.content || '',
    featuredImage: watchedValues.featuredImage || { url: '', alt: '', caption: '' },
    tags: watchedValues.tags || [],
    categories: watchedValues.categories || [],
    seoTitle: watchedValues.seoTitle || '',
    metaDescription: watchedValues.metaDescription || '',
    status: watchedValues.status || 'draft'
  }), [watchedValues]);

  // Load existing post data
  React.useEffect(() => {
    const loadPost = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/simple-posts/${postId}`);
        const data = await response.json();

        if (data.success && data.data) {
          const post = data.data;
          
          // Set form values with existing post data
          form.reset({
            title: post.title || '',
            slug: post.slug || '',
            content: post.content || '',
            featuredImage: post.featuredImage || { url: '', alt: '', caption: '' },
            tags: post.tags || [], // Load existing tags
            categories: post.categories?.map((cat: { _id?: string; name?: string }) => cat._id || cat) || [],
            seoTitle: post.seo?.metaTitle || '',
            metaDescription: post.seo?.metaDescription || '',
            status: post.status || 'draft'
          });

          // Set featured media if available
          if (post.featuredImage?.url) {
            setSelectedFeaturedImage({
              id: 'existing',
              url: post.featuredImage.url,
              altText: post.featuredImage.alt || '',
              caption: post.featuredImage.caption || '',
              filename: 'existing-image',
              originalName: 'existing-image',
              mimeType: 'image/jpeg',
              size: 0,
              uploadedAt: new Date()
            });
          }

          setHasUnsavedChanges(false);
          setLastSaved(new Date());
        } else {
          showSnackbar('Failed to load post data', 'error');
          router.push('/layout-1/blog/simple-posts');
        }
      } catch (error) {
        console.error('Error loading post:', error);
        showSnackbar('Failed to load post data', 'error');
        router.push('/layout-1/blog/simple-posts');
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      loadPost();
    }
  }, [postId, form, router, showSnackbar]);

  // Autosave functionality
  const { isAutoSaving: autosaveInProgress, lastSaved: autosaveLastSaved } = useSimplePostAutosave({
    draft,
    postId,
    setPostId: () => {}, // No need to set postId for existing posts
    delay: 1000,
    onSave: () => {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      console.error('Autosave error:', error);
      showSnackbar(`Autosave failed: ${error}`, 'error');
    }
  });

  // Update autosave state
  React.useEffect(() => {
    setIsAutoSaving(autosaveInProgress);
    if (autosaveLastSaved) {
      setLastSaved(autosaveLastSaved);
    }
  }, [autosaveInProgress, autosaveLastSaved]);

  // Track form changes
  React.useEffect(() => {
    const subscription = watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleSubmit = async (data: SimplePost) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/admin/simple-posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title.trim(),
          slug: data.slug.trim(),
          content: data.content.trim(),
          featuredImage: data.featuredImage,
          tags: data.tags.length > 0 ? data.tags : [],
          categories: data.categories || [],
          seo: {
            metaTitle: data.seoTitle || '',
            metaDescription: data.metaDescription || ''
          },
          status: data.status
        }),
      });

      const result = await response.json();

      if (result.success) {
        showSnackbar('Post updated successfully!', 'success');
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
      } else {
        showSnackbar(result.error || 'Failed to update post', 'error');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      showSnackbar('Failed to update post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    const data = watchedValues;
    if (!data.title.trim() || !data.content.trim()) {
      showSnackbar('Title and content are required for publishing', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/admin/simple-posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          status: 'review',
          publishedAt: new Date().toISOString()
        }),
      });

      const result = await response.json();

      if (result.success) {
        showSnackbar('Post submitted for review successfully!', 'success');
        setValue('status', 'review');
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
      } else {
        showSnackbar(result.error || 'Failed to submit post for review', 'error');
      }
    } catch (error) {
      console.error('Error submitting post for review:', error);
      showSnackbar('Failed to submit post for review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeaturedMediaSelect = (media: MediaAsset | null) => {
    if (media) {
      setSelectedFeaturedImage(media);
      setValue('featuredImage', {
        url: media.url,
        alt: media.altText || '',
        caption: media.caption || ''
      });
    } else {
      setSelectedFeaturedImage(null);
      setValue('featuredImage', { url: '', alt: '', caption: '' });
    }
    setShowMediaLibrary(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/layout-1/blog/simple-posts')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Posts
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Simple Post</h1>
            <p className="text-muted-foreground">
              {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
              {lastSaved && ` • Last saved ${lastSaved.toLocaleTimeString()}`}
              {isAutoSaving && ' • Saving...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(`/preview/simple-post/${postId}`, '_blank')}
            disabled={!postId}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting || !hasUnsavedChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          {watchedValues.status !== 'published' && watchedValues.status !== 'review' && (
            <Button
              onClick={handlePublish}
              disabled={isSubmitting || !watchedValues.title.trim() || !watchedValues.content.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit for Review
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details for your simple post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title *</label>
                  <Input
                    {...form.register('title')}
                    placeholder="Enter post title..."
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Slug *</label>
                  <Input
                    {...form.register('slug')}
                    placeholder="post-slug"
                    className={errors.slug ? 'border-red-500' : ''}
                  />
                  {errors.slug && (
                    <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content *</label>
                  <RichTextEditor
                    content={form.watch('content')}
                    onChange={(content) => form.setValue('content', content)}
                    placeholder="Write your post content..."
                    className="min-h-[300px]"
                  />
                  {errors.content && (
                    <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
                <CardDescription>
                  Select a featured image for your post
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Featured Image - Full Width */}
                <div className="w-full">
                  <FeaturedImageSelector
                    selectedImage={selectedFeaturedImage}
                    onSelectImage={(image) => {
                      setSelectedFeaturedImage(image);
                      if (image) {
                        setValue('featuredImage', {
                          url: image.url,
                          alt: image.altText || '',
                          caption: image.caption || ''
                        });
                      } else {
                        setValue('featuredImage', { url: '', alt: '', caption: '' });
                      }
                    }}
                    onRemoveImage={() => {
                      setSelectedFeaturedImage(null);
                      setValue('featuredImage', { url: '', alt: '', caption: '' });
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMediaLibrary(true)}
                  className="mt-4"
                >
                  Browse Media Library
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                <CardDescription>
                  Select categories for your post
                </CardDescription>
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

            {/* SEO */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>
                  Optimize your post for search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">SEO Title</label>
                  <Input
                    {...form.register('seoTitle')}
                    placeholder="SEO title (optional)"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {watchedValues.seoTitle?.length || 0}/60 characters
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Meta Description</label>
                  <Textarea
                    {...form.register('metaDescription')}
                    placeholder="Meta description (optional)"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {watchedValues.metaDescription?.length || 0}/160 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>
                  Set the publication status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={watchedValues.status}
                  onValueChange={(value) => setValue('status', value as 'draft' | 'review' | 'published' | 'archived')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibrary
          isOpen={showMediaLibrary}
          onSelect={handleFeaturedMediaSelect}
          onClose={() => setShowMediaLibrary(false)}
          allowedTypes={['image']}
        />
      )}
    </div>
  );
}
