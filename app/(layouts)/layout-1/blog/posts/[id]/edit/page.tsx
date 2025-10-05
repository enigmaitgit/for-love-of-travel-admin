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
import { getPost } from '@/lib/api-client';
import { Post, MediaAsset } from '@/lib/api-client';
import { MediaLibrary } from '@/components/cms/MediaLibrary';
import { ContentSection, PostDraftSchema } from '@/lib/validation';
import { useSnackbar } from '@/components/ui/snackbar';
import { CategorySelector } from '@/components/admin/CategorySelector';
import { ErrorDisplay, ValidationErrorDisplay } from '@/components/ui/error-display';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Enhanced schema with better validation messages
const EditPostFormSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .refine(val => val.trim().length > 0, 'Title cannot be empty or just spaces'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  body: z.string()
    .refine(val => !val || val.trim().length >= 10, 'Body must be at least 10 characters if provided')
    .optional(),
  contentSections: z.array(z.any()).optional(),
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  categories: z.array(z.string())
    .max(5, 'Maximum 5 categories allowed')
    .optional(),
  featuredImage: z.string()
    .refine(val => !val || val.startsWith('data:') || val.startsWith('http'), 'Invalid image format')
    .optional(),
  seoTitle: z.string()
    .max(60, 'SEO title should be less than 60 characters for optimal search results')
    .optional(),
  metaDescription: z.string()
    .max(160, 'Meta description should be less than 160 characters for optimal search results')
    .optional(),
  status: z.enum(['draft', 'review', 'scheduled', 'published']).optional(),
  jsonLd: z.boolean().optional(),
  breadcrumb: z.any().optional(),
  readingTime: z.number()
    .refine(val => !val || val > 0, 'Reading time must be positive')
    .optional(),
});

type PostFormData = z.infer<typeof EditPostFormSchema>;

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { showSnackbar } = useSnackbar();
  
  console.log('EditPostPage: Route params:', params);
  console.log('EditPostPage: Post ID:', postId);
  console.log('EditPostPage: Post ID type:', typeof postId);
  
  // Centralize ID derivation and validation
  const resolvedId = React.useMemo(() => {
    const sanitized = postId?.toString().trim();
    const isValid = sanitized && 
      sanitized !== 'undefined' && 
      sanitized !== 'null' && 
      sanitized !== '' &&
      sanitized.length >= 24; // MongoDB ObjectId should be at least 24 chars
    
    return {
      id: sanitized,
      isValid,
      canFetch: isValid
    };
  }, [postId]);
  
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
  const [contentSectionsTimeout, setContentSectionsTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [isEditingContentSection, setIsEditingContentSection] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Array<{field: string; message: string; value?: any}>>([]);
  const [showValidationErrors, setShowValidationErrors] = React.useState(false);
  const shouldAutoSave = React.useRef(false);
  
  const permissions = getCurrentUserPermissions();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
  const isFormDirty = isDirty;
  
  // Debug form state changes
  React.useEffect(() => {
    console.log('EditPostPage: Form state changed:', {
      errors: Object.keys(errors),
      saving,
      isAutoSaving,
      isEditingContentSection,
      isFormDirty,
      watchedValues: {
        title: watchedValues.title,
        slug: watchedValues.slug,
        categories: watchedValues.categories,
        tags: watchedValues.tags
      }
    });
  }, [errors, saving, isAutoSaving, isEditingContentSection, isFormDirty, watchedValues]);

  // Track when form becomes dirty for autosave
  React.useEffect(() => {
    if (!postId || !post || isInitialLoad) return;
    
    // Set the flag that we should auto-save when form is dirty
    shouldAutoSave.current = isFormDirty;
    
    if (isFormDirty) {
      setHasUnsavedChanges(true);
    }
  }, [isFormDirty, postId, post, isInitialLoad]);

  // Auto-save for general form changes
  React.useEffect(() => {
    if (!postId || !post || isInitialLoad) return; // Don't auto-save on initial load
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Auto-save after 2 seconds of inactivity
    const timeoutId = setTimeout(() => {
      // Only auto-save if form is actually dirty
      if (shouldAutoSave.current) {
        autoSaveForm();
      }
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
      // Exclude status from auto-save to prevent automatic status changes
      const { status, ...autoSaveData } = watchedValues;
      
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...autoSaveData,
          contentSections: contentSections,
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        shouldAutoSave.current = false; // Reset the flag after successful save
        console.log('Auto-save successful');
      } else {
        console.warn('Auto-save failed with status:', response.status);
        // Don't show error for auto-save failures to avoid spam
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error for auto-save failures to avoid spam
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Auto-save function for content sections
  const autoSaveContentSections = async (sections: ContentSection[]) => {
    if (!postId || isAutoSaving || isEditingContentSection) return;
    
    console.log('EditPostPage: Auto-saving content sections:', sections);
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
        console.log('EditPostPage: Content sections auto-saved successfully');
      } else {
        console.warn('EditPostPage: Content sections auto-save failed with status:', response.status);
        const errorData = await response.json();
        console.error('EditPostPage: Auto-save error response:', errorData);
      }
    } catch (error) {
      console.error('EditPostPage: Content sections auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Handle content sections changes with debouncing
  const handleContentSectionsChange = (newSections: ContentSection[]) => {
    console.log('EditPostPage: Content sections changed:', newSections);
    setContentSections(newSections);
    setHasUnsavedChanges(true);
    
    // Clear existing timeout
    if (contentSectionsTimeout) {
      clearTimeout(contentSectionsTimeout);
    }
    
    // Debounce the form data update to prevent auto-submission
    const timeoutId = setTimeout(() => {
      console.log('EditPostPage: Setting form value for contentSections:', newSections);
      setValue('contentSections', newSections);
    }, 500); // 500ms debounce
    
    setContentSectionsTimeout(timeoutId);
    
    // Only auto-save if not currently editing a content section
    if (!isEditingContentSection) {
      // Auto-save after 10 seconds of inactivity (increased from 5 seconds)
      const autoSaveTimeoutId = setTimeout(() => {
        console.log('EditPostPage: Auto-saving content sections:', newSections);
        autoSaveContentSections(newSections);
      }, 10000);
      
      setContentSectionsTimeout(autoSaveTimeoutId);
    }
  };

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
      if (contentSectionsTimeout) {
        clearTimeout(contentSectionsTimeout);
      }
    };
  }, [autoSaveTimeout, contentSectionsTimeout]);

  // Guard: Don't fetch until we have a valid ID
  React.useEffect(() => {
    if (!resolvedId.isValid) {
      console.error('EditPostPage: Invalid or missing post ID:', { 
        original: postId, 
        sanitized: resolvedId.id,
        type: typeof postId 
      });
      showSnackbar('Invalid post ID. Please select a valid post to edit.', 'error');
      router.push('/layout-1/blog/posts');
      return;
    }

    const fetchPost = async () => {
      try {
        console.log('EditPostPage: Fetching post with sanitized ID:', resolvedId.id);
        
        const postData = await getPost(resolvedId.id!);
        console.log('EditPostPage: Received post data:', postData);
        
        if (postData) {
          setPost(postData);
          
          // ContentSections are already transformed by getPost function
          const transformedSections = postData.contentSections || [];
          console.log('EditPostPage: Content sections:', transformedSections);
          
          // Populate form with existing data
          setValue('title', postData.title);
          setValue('slug', postData.slug);
          setValue('body', postData.body || '');
          setValue('contentSections', transformedSections);
          setValue('tags', postData.tags || []);
          // Extract category IDs from populated objects
          const categoryIds = postData.categories ? 
            postData.categories.map((cat: any) => typeof cat === 'string' ? cat : cat._id) : [];
          setValue('categories', categoryIds);
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
          setContentSections(transformedSections);
          
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

    // Only fetch if we have a valid sanitized ID
    if (resolvedId.canFetch) {
      fetchPost();
    }
  }, [resolvedId.canFetch, setValue, router, showSnackbar]);

  const onSubmit = async (data: PostFormData) => {
    console.log('EditPostPage: Form submission started');
    console.log('EditPostPage: Form data:', data);
    console.log('EditPostPage: Form errors:', errors);
    console.log('EditPostPage: Content sections:', contentSections);
    
    if (!permissions.includes('post:edit')) {
      showSnackbar('You do not have permission to edit posts', 'error');
      return;
    }

    // Prevent submission if currently editing a content section
    if (isEditingContentSection) {
      showSnackbar('Please finish editing the content section before saving', 'warning');
      return;
    }

    // Check for validation errors
    if (Object.keys(errors).length > 0) {
      console.log('EditPostPage: Validation errors preventing submission:', errors);
      showSnackbar('Please fix validation errors before saving', 'error');
      setShowValidationErrors(true);
      return;
    }

    setSaving(true);
    try {
      const requestBody = {
        ...data,
        contentSections: contentSections,
      };
      
      console.log('EditPostPage: Updating post with data:', {
        title: requestBody.title,
        slug: requestBody.slug,
        body: requestBody.body?.substring(0, 100) + '...',
        contentSections: requestBody.contentSections?.length || 0,
        status: requestBody.status,
        categories: requestBody.categories
      });
      
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        showSnackbar('✅ Post updated successfully! Your changes have been saved.', 'success');
        // Add a small delay to ensure the update is processed
        setTimeout(() => {
          router.push('/layout-1/blog/posts');
        }, 1500);
      } else {
        let errorMessage = 'Failed to update post. Please try again.';
        let errorDetails = '';
        
        try {
          const errorData = await response.json();
          console.error('Error updating post:', errorData);
          console.error('Response status:', response.status);
          
          // Handle different error response formats
          if (errorData.success === false) {
            errorMessage = errorData.error || errorData.message || 'Operation failed';
            errorDetails = errorData.details || '';
          } else if (errorData.error) {
            errorMessage = errorData.error;
            errorDetails = errorData.details || '';
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
            // Handle structured validation errors
            setValidationErrors(errorData.validationErrors);
            setShowValidationErrors(true);
            errorMessage = `Validation failed: ${errorData.validationErrors.length} field(s) need attention`;
            errorDetails = 'Please check the highlighted fields and try again.';
          } else if (errorData.details && Array.isArray(errorData.details)) {
            // Handle validation errors from express-validator
            errorMessage = errorData.details.map((err: any) => err.msg || err.message).join('; ');
            errorDetails = 'Please check the form fields and try again.';
          } else if (Array.isArray(errorData) && errorData.length > 0) {
            errorMessage = errorData[0].msg || errorData[0].message || 'Validation error';
          }
          
          // Handle specific HTTP status codes
          switch (response.status) {
            case 400:
              errorMessage = errorMessage || 'Invalid data provided';
              errorDetails = errorDetails || 'Please check your input and try again.';
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
              errorDetails = 'The content is too large. Please reduce the size of images or content.';
              break;
            case 500:
              errorMessage = 'Server error';
              errorDetails = 'Something went wrong on our end. Please try again later.';
              break;
            default:
              errorMessage = errorMessage || `Server error (${response.status})`;
              errorDetails = errorDetails || 'Please try again later.';
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `Server error (${response.status})`;
          errorDetails = 'Unable to parse server response. Please try again.';
        }
        
        // Show detailed error message
        const fullErrorMessage = errorDetails ? `${errorMessage}. ${errorDetails}` : errorMessage;
        showSnackbar(fullErrorMessage, 'error');
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
        ...watchedValues,
        contentSections: contentSections,
        status: 'draft' // Explicitly set status to draft
      };
      
      console.log('Save Draft - Request body:', requestBody);
      
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        showSnackbar('💾 Draft saved successfully! Your work has been automatically saved.', 'success');
        // Update the post state to reflect the draft status
        setPost(prev => prev ? { ...prev, status: 'draft' } : null);
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
        {/* Validation Errors Display */}
        {showValidationErrors && validationErrors.length > 0 && (
          <ValidationErrorDisplay
            errors={validationErrors}
            onDismiss={() => setShowValidationErrors(false)}
          />
        )}

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
        {/* Validation Errors Display */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>
                  <strong>{field}:</strong> {error?.message || 'Invalid value'}
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
                    className={`${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} transition-colors`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.title ? (
                      <p className="text-sm text-red-500">{errors.title.message}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Enter a descriptive title for your post</p>
                    )}
                    <span className="text-xs text-gray-400">
                      {watch('title')?.length || 0}/200
                    </span>
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
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.slug ? (
                      <p className="text-sm text-red-500">{errors.slug.message}</p>
                    ) : (
                      <p className="text-sm text-gray-500">URL-friendly version of the title</p>
                    )}
                    <span className="text-xs text-gray-400">
                      {watch('slug')?.length || 0}/100
                    </span>
                  </div>
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
                    onValueChange={(value) => setValue('status', value as 'draft' | 'review' | 'scheduled' | 'published')}
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
                  <Button 
                    type="submit" 
                    disabled={saving || isAutoSaving} 
                    className="w-full"
                    onClick={() => console.log('EditPostPage: Update Post button clicked')}
                  >
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
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={saving || isAutoSaving} 
                    onClick={handleSaveDraft}
                    className="w-full"
                  >
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
                  <CategorySelector
                    selectedCategories={watch('categories') || []}
                    onCategoriesChange={(categories) => setValue('categories', categories)}
                    placeholder="Select categories..."
                    maxSelections={5}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                      }
                    }}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                      }
                    }}
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
                  <Select value={post?.status || 'draft'} onValueChange={(value) => setValue('status', value as 'draft' | 'review' | 'scheduled' | 'published')}>
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
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving || isAutoSaving}
              onClick={handleSaveDraft}
              className="min-w-32"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              type="submit"
              disabled={saving || isAutoSaving}
              className="min-w-32"
              onClick={() => console.log('EditPostPage: Save Changes button clicked')}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
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
    </ErrorBoundary>
  );
}
