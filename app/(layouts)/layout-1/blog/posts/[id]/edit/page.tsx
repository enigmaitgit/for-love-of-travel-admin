'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, FieldError } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { X, Save, Eye, Trash2, Send } from 'lucide-react';
import { getCurrentUserPermissions } from '@/lib/rbac';
import { getPost, Post } from '@/lib/api-client';
import type { MediaAsset } from '@/lib/api'; // ✅ use the module that actually exports MediaAsset
import { MediaLibrary } from '@/components/cms/MediaLibrary';
import { FeaturedMediaSelector } from '@/components/cms/FeaturedMediaSelector';
import { ContentSection } from '@/lib/validation';
import { useSnackbar } from '@/components/ui/snackbar';
import { ValidationErrorDisplay } from '@/components/ui/error-display';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { CategorySelector } from '@/components/admin/CategorySelector';
import {
  sanitizeContentSections,
  sanitizeFeaturedImage,
  logContentSectionStats,
} from '@/lib/content-sanitizer';

/** ------------------------------------------------------------------
 *  Small inline fallback Category selector (since the import was missing)
 *  Replace with your real CategorySelector later when available.
 *  ------------------------------------------------------------------ */
/** ------------------------------------------------------------------ */

const EditPostFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .refine((val) => val.trim().length > 0, 'Title cannot be empty or just spaces'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  body: z.string().optional(),
  contentSections: z.array(z.any()).optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  categories: z.array(z.union([
    z.string(),
    z.object({
      _id: z.string(),
      name: z.string(),
      slug: z.string().optional(),
      description: z.string().optional(),
      color: z.string().optional(),
      parent: z.string().optional(),
      isActive: z.boolean().optional(),
    })
  ])).max(5, 'Maximum 5 categories allowed').optional(),
  featuredImage: z
    .string()
    .refine(
      (val) => !val || val.startsWith('data:') || val.startsWith('http'),
      'Invalid image format'
    )
    .optional(),
  featuredMedia: z.object({
    url: z.string().refine((val) => {
      return /^(https?:\/\/.+|data:image\/[a-zA-Z]+;base64,.+|data:video\/[a-zA-Z]+;base64,.+)$/.test(val);
    }, 'Featured media URL must be valid'),
    alt: z.string().optional(),
    caption: z.string().optional(),
    type: z.enum(['image', 'video']),
    width: z.number().optional(),
    height: z.number().optional(),
    duration: z.number().optional()
  }).optional(),
  seoTitle: z.string().max(60, 'SEO title should be less than 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description should be less than 160 characters').optional(),
  status: z.enum(['draft', 'review', 'scheduled', 'published']).optional(),
  jsonLd: z.boolean().optional(),
  breadcrumb: z.any().optional(),
  readingTime: z.number().optional().refine((val) => val === undefined || val > 0, 'Reading time must be positive'),
});

type PostFormData = z.infer<typeof EditPostFormSchema>;

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = params?.id;
  const { showSnackbar } = useSnackbar();

  const resolvedId = React.useMemo(() => {
    const sanitized = postId?.toString().trim();
    const isValid =
      !!sanitized && sanitized !== 'undefined' && sanitized !== 'null' && sanitized !== '' && sanitized.length >= 24;
    return { id: sanitized, isValid, canFetch: isValid };
  }, [postId]);

  const [post, setPost] = React.useState<Post | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<MediaAsset | null>(null);
  const [selectedFeaturedMedia, setSelectedFeaturedMedia] = React.useState<MediaAsset | null>(null);
  const [contentSections, setContentSections] = React.useState<ContentSection[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [isAutoSaving, setIsAutoSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = React.useState<ReturnType<typeof setTimeout> | null>(null);
  const [contentSectionsTimeout, setContentSectionsTimeout] = React.useState<ReturnType<typeof setTimeout> | null>(null);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [isEditingContentSection, setIsEditingContentSection] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Array<{ field: string; message: string; value?: unknown }>>([]);
  const [showValidationErrors, setShowValidationErrors] = React.useState(false);
  const shouldAutoSave = React.useRef(false);

  const permissions = getCurrentUserPermissions();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isDirty },
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
      featuredMedia: undefined,
      seoTitle: '',
      metaDescription: '',
      jsonLd: false,
      breadcrumb: {
        enabled: true,
        items: [
          { label: 'Home', href: '/' },
          { label: 'Destinations', href: '#destinations' },
        ],
      },
      readingTime: 0,
    },
  });

  // Watch individual fields to avoid infinite re-renders
  const watchedTitle = watch('title');
  const watchedSlug = watch('slug');
  const watchedBody = watch('body');
  const watchedTags = watch('tags');
  const watchedCategories = watch('categories');
  const watchedFeaturedImage = watch('featuredImage');
  const watchedSeoTitle = watch('seoTitle');
  const watchedMetaDescription = watch('metaDescription');
  const watchedJsonLd = watch('jsonLd');
  const watchedBreadcrumb = watch('breadcrumb');
  const watchedReadingTime = watch('readingTime');
  
  const isFormDirty = isDirty;

  // ✅ define autoSaveForm BEFORE any effects reference it
  const autoSaveForm = React.useCallback(async () => {
    if (!postId || isAutoSaving) return;

    // Get current form values directly instead of using watchedValues dependency
    const currentValues = getValues();
    const hasContentSections = contentSections.length > 0;
    const hasBasicContent =
      (currentValues.title && currentValues.title.trim()) ||
      (currentValues.body && currentValues.body.trim());

    if (!hasBasicContent && !hasContentSections) return;

    setIsAutoSaving(true);
    try {
      const { status: _, ...autoSaveData } = currentValues;
      
      // Transform categories to IDs for backend compatibility
      const transformedData = {
        ...autoSaveData,
        categories: autoSaveData.categories?.map((cat: unknown) =>
          typeof cat === 'string' ? cat : (cat as { _id: string })._id
        ) || [],
        contentSections
      };
      
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedData),
      });

      if (response.ok) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        shouldAutoSave.current = false;
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setIsAutoSaving(false);
    }
  }, [postId, isAutoSaving, contentSections, getValues]);

  React.useEffect(() => {
    if (!postId || !post || isInitialLoad) return;
    shouldAutoSave.current = isFormDirty;
    if (isFormDirty) setHasUnsavedChanges(true);
  }, [isFormDirty, postId, post, isInitialLoad]);

  React.useEffect(() => {
    if (!postId || !post || isInitialLoad) return;
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

    const timeoutId = setTimeout(() => {
      if (shouldAutoSave.current) autoSaveForm();
    }, 2000);

    setAutoSaveTimeout(timeoutId);
    return () => clearTimeout(timeoutId);
  }, [
    watchedTitle,
    watchedSlug,
    watchedBody,
    watchedTags,
    watchedCategories,
    watchedFeaturedImage,
    watchedSeoTitle,
    watchedMetaDescription,
    watchedJsonLd,
    watchedBreadcrumb,
    watchedReadingTime,
    contentSections,
    postId,
    post,
    isInitialLoad,
    autoSaveForm // ✅ now safe
  ]);

  const autoSaveContentSections = async (sections: ContentSection[]) => {
    if (!postId || isAutoSaving || isEditingContentSection) return;
    setIsAutoSaving(true);
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentSections: sections }),
      });
      if (response.ok) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Content sections auto-save failed:', response.status, errorData);
      }
    } catch (err) {
      console.error('Content sections auto-save failed:', err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleContentSectionsChange = (newSections: ContentSection[]) => {
    setContentSections(newSections);
    setHasUnsavedChanges(true);

    if (contentSectionsTimeout) clearTimeout(contentSectionsTimeout);

    const timeoutId = setTimeout(() => setValue('contentSections', newSections), 500);
    setContentSectionsTimeout(timeoutId);

    if (!isEditingContentSection) {
      const autoSaveTimeoutId = setTimeout(() => autoSaveContentSections(newSections), 10000);
      setContentSectionsTimeout(autoSaveTimeoutId);
    }
  };

  React.useEffect(() => {
    return () => {
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
      if (contentSectionsTimeout) clearTimeout(contentSectionsTimeout);
    };
  }, [autoSaveTimeout, contentSectionsTimeout]);

  React.useEffect(() => {
    if (!resolvedId.isValid) {
      console.error('EditPostPage: Invalid or missing post ID:', {
        original: postId,
        sanitized: resolvedId.id,
        type: typeof postId,
      });
      showSnackbar('Invalid post ID. Please select a valid post to edit.', 'error');
      router.push('/layout-1/blog/posts');
      return;
    }

    const fetchPost = async () => {
      try {
        const postData = await getPost(resolvedId.id!);
        if (!postData) {
          router.push('/layout-1/blog/posts');
          return;
        }

        setPost(postData);

        const transformedSections = postData.contentSections || [];
        setValue('title', postData.title);
        setValue('slug', postData.slug);
        setValue('body', postData.body || '');
        setValue('contentSections', transformedSections);
        setValue('tags', postData.tags || []);

        // Keep categories as objects for CategorySelector compatibility
        const categories = postData.categories || [];
        setValue('categories', categories);

        setValue(
          'featuredImage',
          typeof postData.featuredImage === 'string'
            ? postData.featuredImage
            : postData.featuredImage?.url || ''
        );

        // Set featuredMedia if it exists
        if (postData.featuredMedia) {
          setValue('featuredMedia', postData.featuredMedia);
        }
        setValue('seoTitle', (postData as PostFormData).seoTitle || '');
        setValue('metaDescription', (postData as PostFormData).metaDescription || '');
        setValue('jsonLd', (postData as PostFormData).jsonLd || false);
        setValue(
          'breadcrumb',
          (postData as PostFormData).breadcrumb || {
            enabled: true,
            items: [
              { label: 'Home', href: '/' },
              { label: 'Destinations', href: '#destinations' },
            ],
          }
        );
        setValue('readingTime', (postData as PostFormData).readingTime || 0);

        setContentSections(transformedSections);

        if (postData.featuredImage) {
          const imageUrl =
            typeof postData.featuredImage === 'string'
              ? postData.featuredImage
              : postData.featuredImage.url;
          
          // Only proceed if imageUrl is valid
          if (imageUrl) {
            const isDataUrl = imageUrl.startsWith('data:');
            const filename = isDataUrl ? 'Featured Image' : imageUrl.split('/').pop() || 'Featured Image';
            setSelectedImage({
              id: 'existing-' + postId,
              url: imageUrl,
              size: isDataUrl ? Math.round(imageUrl.length / 1024) : 0,
              filename,
              originalName: filename,
              mimeType: 'image/jpeg',
              uploadedAt: new Date(),
            } as MediaAsset);
          }
        }

        // Set selectedFeaturedMedia if featuredMedia exists
        if (postData.featuredMedia && postData.featuredMedia.url) {
          const mediaUrl = postData.featuredMedia.url;
          const isDataUrl = mediaUrl.startsWith('data:');
          const filename = isDataUrl ? 'Featured Media' : mediaUrl.split('/').pop() || 'Featured Media';
          setSelectedFeaturedMedia({
            id: 'existing-media-' + postId,
            url: mediaUrl,
            size: isDataUrl ? Math.round(mediaUrl.length / 1024) : 0,
            filename,
            originalName: filename,
            mimeType: postData.featuredMedia.type === 'video' ? 'video/mp4' : 'image/jpeg',
            uploadedAt: new Date(),
            dimensions: postData.featuredMedia.width && postData.featuredMedia.height ? {
              width: postData.featuredMedia.width,
              height: postData.featuredMedia.height
            } : undefined,
            duration: postData.featuredMedia.duration
          } as MediaAsset);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        router.push('/layout-1/blog/posts');
      } finally {
        setLoading(false);
        setTimeout(() => setIsInitialLoad(false), 1000);
      }
    };

    if (resolvedId.canFetch) fetchPost();
  }, [resolvedId.canFetch, setValue, router, showSnackbar, postId, resolvedId.id, resolvedId.isValid]);

  const onSubmit = async (data: PostFormData) => {
    if (!permissions.includes('post:edit')) {
      showSnackbar('You do not have permission to edit posts', 'error');
      return;
    }
    if (isEditingContentSection) {
      showSnackbar('Please finish editing the content section before saving', 'warning');
      return;
    }
    if (Object.keys(errors).length > 0) {
      showSnackbar('Please fix validation errors before saving', 'error');
      setShowValidationErrors(true);
      return;
    }

    setSaving(true);
    try {
      const sanitizedContentSections = sanitizeContentSections(contentSections);
      const sanitizedFeaturedImage = sanitizeFeaturedImage(data.featuredImage);
      logContentSectionStats(contentSections);
      logContentSectionStats(sanitizedContentSections);

      const requestBody = {
        ...data,
        featuredImage: sanitizedFeaturedImage,
        contentSections: sanitizedContentSections,
        // Transform categories to IDs for backend compatibility
        categories: data.categories?.map((cat: unknown) =>
          typeof cat === 'string' ? cat : (cat as { _id: string })._id
        ) || [],
      };

      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        showSnackbar('✅ Post updated successfully! Your changes have been saved.', 'success');
        setTimeout(() => router.push('/layout-1/blog/posts'), 1500);
      } else {
        let errorMessage = 'Failed to update post. Please try again.';
        let errorDetails = '';
        try {
          const errorData = await response.json();
          if (errorData?.success === false) {
            errorMessage = errorData.error || errorData.message || errorMessage;
            errorDetails = errorData.details || '';
          } else if (errorData?.error || errorData?.message) {
            errorMessage = errorData.error || errorData.message;
          } else if (Array.isArray(errorData?.validationErrors)) {
            setValidationErrors(errorData.validationErrors);
            setShowValidationErrors(true);
            errorMessage = `Validation failed: ${errorData.validationErrors.length} field(s) need attention`;
            errorDetails = 'Please check the highlighted fields and try again.';
          }
          switch (response.status) {
            case 400:
              errorDetails ||= 'Please check your input and try again.';
              break;
            case 401:
              errorMessage = 'Authentication required';
              errorDetails = 'Please log in and try again.';
              break;
            case 403:
              errorMessage = 'Permission denied';
              errorDetails = 'You do not have permission to perform this action.';
              break;
            case 404:
              errorMessage = 'Post not found';
              errorDetails = 'The post you are trying to update may have been deleted.';
              break;
            case 409:
              errorMessage = 'Conflict detected';
              errorDetails = 'A post with this title or slug already exists.';
              break;
            case 413:
              errorMessage = 'Request too large';
              errorDetails = 'Reduce the size of images or content.';
              break;
            case 500:
              errorMessage = 'Server error';
              errorDetails = 'Something went wrong on our end. Try again later.';
              break;
          }
        } catch {
          errorMessage = `Server error (${response.status})`;
          errorDetails = 'Unable to parse server response.';
        }
        showSnackbar(errorDetails ? `${errorMessage}. ${errorDetails}` : errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      showSnackbar('Failed to update post. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!permissions.includes('post:edit')) {
      showSnackbar('You do not have permission to edit posts', 'error');
      return;
    }

    setSaving(true);
    try {
      const requestBody = { 
        title: watchedTitle,
        slug: watchedSlug,
        body: watchedBody,
        tags: watchedTags,
        categories: watchedCategories,
        featuredImage: watchedFeaturedImage,
        seoTitle: watchedSeoTitle,
        metaDescription: watchedMetaDescription,
        jsonLd: watchedJsonLd,
        breadcrumb: watchedBreadcrumb,
        readingTime: watchedReadingTime,
        contentSections, 
        status: 'draft' as const 
      };
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        showSnackbar('💾 Draft saved successfully!', 'success');
        setPost((prev) => (prev ? { ...prev, status: 'draft' } : null));
      } else {
        let msg = 'Failed to save draft. Please try again.';
        try {
          const data = await response.json();
          msg = data?.error || data?.message || msg;
        } catch {}
        showSnackbar(msg, 'error');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      showSnackbar('Failed to save draft. Please try again.', 'error');
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
    if (post) window.open(`/preview/post/${post.id}`, '_blank');
  };

  // const canPublish = permissions.includes('post:publish');
  // const canDelete = permissions.includes('post:delete');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="text-muted-foreground">Loading post...</div>
        <div className="text-xs text-gray-400">Please wait while we fetch your post data</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-6xl">📄</div>
        <div className="text-muted-foreground text-lg">Post not found</div>
        <div className="text-sm text-gray-400 text-center max-w-md">
          The post you're looking for doesn't exist or may have been deleted.
        </div>
        <Button onClick={() => router.push('/layout-1/blog/posts')} variant="outline">
          Back to Posts
        </Button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 ml-6">
        {showValidationErrors && validationErrors.length > 0 && (
          <ValidationErrorDisplay errors={validationErrors} onDismiss={() => setShowValidationErrors(false)} />
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit Post</h1>
            <p className="text-muted-foreground">Update your blog post or article</p>
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
            <Button onClick={() => router.push('/layout-1/blog/posts')}>Back to Posts</Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {Object.keys(errors).length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {(error as FieldError)?.message || 'Invalid value'}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
                    onEditingChange={setIsEditingContentSection}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
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
                          className={`${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} transition-colors`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault();
                          }}
                        />
                        <div className="flex justify-between items-center mt-1">
                          {errors.title ? (
                            <p className="text-sm text-red-500">{errors.title.message}</p>
                          ) : (
                            <p className="text-sm text-gray-500">Enter a descriptive title for your post</p>
                          )}
                          <span className="text-xs text-gray-400">{watch('title')?.length || 0}/200</span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="slug">Slug *</Label>
                        <Input
                          id="slug"
                          {...register('slug')}
                          placeholder="post-slug"
                          className={`${errors.slug ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} transition-colors`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault();
                          }}
                        />
                        <div className="flex justify-between items-center mt-1">
                          {errors.slug ? (
                            <p className="text-sm text-red-500">{errors.slug.message}</p>
                          ) : (
                            <p className="text-sm text-gray-500">URL-friendly version of the title</p>
                          )}
                          <span className="text-xs text-gray-400">{watch('slug')?.length || 0}/100</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <Label htmlFor="body">Body</Label>
                        <RichTextEditor
                          content={watchedBody}
                          onChange={(content) => setValue('body', content)}
                          placeholder="Write your post content here..."
                          className={`min-h-[300px] ${errors.body ? 'border-red-500' : ''}`}
                        />
                        {errors.body && <p className="text-sm text-red-500 mt-1">{errors.body.message}</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Publish</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          defaultValue={post.status}
                          onValueChange={(value) => setValue('status', value as 'draft' | 'review' | 'scheduled' | 'published')}
                          disabled={!permissions.includes('post:publish')}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            {permissions.includes('post:publish') && (
                              <>
                                <SelectItem value="review">Review</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
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
                        <Button type="submit" disabled={saving || isAutoSaving} className="w-full">
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Updating Post...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Update Post
                            </>
                          )}
                        </Button>

                        <Button type="button" variant="outline" disabled={saving || isAutoSaving} onClick={handleSaveDraft} className="w-full">
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                              Saving Draft...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Draft
                            </>
                          )}
                        </Button>

                        {permissions.includes('post:publish') && (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={saving || isAutoSaving}
                            className="w-full"
                            onClick={async () => {
                              if (!postId) {
                                showSnackbar('Post ID is required', 'error');
                                return;
                              }

                              // Validate required fields
                              if (!watchedTitle || watchedTitle.trim().length === 0) {
                                showSnackbar('Title is required for submitting for review', 'error');
                                return;
                              }

                              // Check if there's enough content
                              const hasBodyContent = watchedBody && watchedBody.replace(/<[^>]*>/g, '').trim().length >= 50;
                              const hasContentSections = contentSections && contentSections.length > 0;
                              
                              if (!hasBodyContent && !hasContentSections) {
                                showSnackbar('Post must have at least 50 characters of content or content sections to submit for review', 'error');
                                return;
                              }

                              setSaving(true);
                              try {
                                const publishData = {
                                  title: watchedTitle.trim(),
                                  body: watchedBody || '',
                                  contentSections: contentSections,
                                  tags: (watchedTags && watchedTags.length > 0) ? watchedTags : [],
                                  // Transform categories to IDs for backend compatibility
                                  categories: (watchedCategories || []).map((cat: unknown) =>
                                    typeof cat === 'string' ? cat : (cat as { _id: string })._id
                                  ),
                                };

                                const response = await fetch(`/api/admin/posts/${postId}/publish/test`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(publishData),
                                });

                                if (response.ok) {
                                  await response.json();
                                  setHasUnsavedChanges(false);
                                  showSnackbar('Post submitted for review successfully!', 'success');
                                  router.push('/layout-1/blog/posts');
                                } else {
                                  let errorMessage = 'Unknown error occurred';
                                  try {
                                    const errorData = await response.json();
                                    errorMessage = errorData.error || errorData.message || errorMessage;
                                  } catch {}
                                  showSnackbar(`Failed to submit for review: ${errorMessage}`, 'error');
                                }
                              } catch (error) {
                                console.error('Error submitting for review:', error);
                                showSnackbar('Failed to submit for review. Please try again.', 'error');
                              } finally {
                                setSaving(false);
                              }
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Submit for Review
                          </Button>
                        )}

                        {permissions.includes('post:delete') && (
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={saving}
                            className="w-full"
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                                try {
                                  const response = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
                                  if (response.ok) router.push('/layout-1/blog/posts');
                                  else alert('Failed to delete post. Please try again.');
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
                        <CategorySelector
                          selectedCategories={(watch('categories') || []).map((cat: unknown) =>
                            typeof cat === 'string' ? cat : (cat as { _id: string })._id
                          )}
                          onCategoriesChange={(categoryIds) => {
                            // Convert IDs back to Category objects for form storage
                            const categoryObjects = categoryIds.map(id => {
                              const existing = (watch('categories') || []).find((cat: unknown) =>
                                typeof cat === 'object' && (cat as { _id: string })._id === id
                              );
                              return existing || { _id: id, name: id }; // Fallback if not found
                            });
                            setValue('categories', categoryObjects);
                          }}
                          placeholder="Select categories..."
                          maxSelections={5}
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>

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
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault();
                          }}
                        />
                        {errors.seoTitle && <p className="text-sm text-red-500 mt-1">{errors.seoTitle.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea
                          id="metaDescription"
                          {...register('metaDescription')}
                          placeholder="Brief description for search engines..."
                          rows={3}
                          className={errors.metaDescription ? 'border-red-500' : ''}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) e.preventDefault();
                          }}
                        />
                        {errors.metaDescription && <p className="text-sm text-red-500 mt-1">{errors.metaDescription.message}</p>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="jsonLd" checked={!!watch('jsonLd')} onCheckedChange={(checked) => setValue('jsonLd', checked)} />
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
                    <Label htmlFor="seoTitle2">SEO Title</Label>
                    <Input
                      id="seoTitle2"
                      {...register('seoTitle')}
                      placeholder="SEO optimized title..."
                      className={errors.seoTitle ? 'border-red-500' : ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                    />
                    {errors.seoTitle && <p className="text-sm text-red-500 mt-1">{errors.seoTitle.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="metaDescription2">Meta Description</Label>
                    <Textarea
                      id="metaDescription2"
                      {...register('metaDescription')}
                      placeholder="Brief description for search engines..."
                      rows={3}
                      className={errors.metaDescription ? 'border-red-500' : ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) e.preventDefault();
                      }}
                    />
                    {errors.metaDescription && <p className="text-sm text-red-500 mt-1">{errors.metaDescription.message}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="jsonLd2" checked={!!watch('jsonLd')} onCheckedChange={(checked) => setValue('jsonLd', checked)} />
                    <Label htmlFor="jsonLd2">Enable JSON-LD structured data</Label>
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
                    <Label htmlFor="status2">Status</Label>
                    <Select
                      value={post?.status || 'draft'}
                      onValueChange={(value) => setValue('status', value as 'draft' | 'review' | 'scheduled' | 'published')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={saving || isAutoSaving} onClick={handleSaveDraft} className="min-w-32">
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button type="submit" disabled={saving || isAutoSaving} className="min-w-32">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>

        <MediaLibrary
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleImageSelect}
          selectedAssetId={selectedImage?.id}
        />
      </div>
    </ErrorBoundary>
  );
}
