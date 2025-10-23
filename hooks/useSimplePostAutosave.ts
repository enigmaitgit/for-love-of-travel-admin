import { useCallback, useEffect, useRef, useState } from 'react';
import { useSnackbar } from '@/components/ui/snackbar';

// Robust error parsing helper
async function parseError(response: Response) {
  const ct = response.headers.get('content-type') || '';
  const raw = await response.text(); // don't lose it
  try {
    if (ct.includes('application/json')) return JSON.parse(raw);
  } catch {}
  return { message: raw || `${response.status} ${response.statusText}` };
}

// Helper to check if string is a valid ObjectId
const isId = (s: string) => /^[a-f0-9]{24}$/i.test(s);

// Robust payload builder that omits empty fields instead of sending empty strings
const buildPayload = (draft: SimplePostDraft, forCreate: boolean) => {
  const payload: any = {
    title: draft.title?.trim() || '',
    content: draft.content?.trim() || '',
    status: 'draft',
  };

  // slug - always ensure we have a valid slug
  if (forCreate) {
    payload.slug = (draft.slug?.trim())
      || (draft.title?.trim()
           ? draft.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
           : `simple-draft-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
  } else {
    // For updates, always send slug if we have one, or generate from title
    payload.slug = (draft.slug?.trim())
      || (draft.title?.trim()
           ? draft.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
           : `simple-draft-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
  }

  // featuredImage - always send for creates (required), only send valid URLs for updates
  if (forCreate) {
    // For create, always provide featuredImage (required by model)
    payload.featuredImage = {
      url: draft.featuredImage?.url?.trim() || 'https://via.placeholder.com/800x600?text=No+Image+Selected',
      alt: draft.featuredImage?.alt || '',
      caption: draft.featuredImage?.caption || ''
    };
  } else if (draft.featuredImage?.url?.trim()) {
    // For updates, only send if we have a valid URL
    payload.featuredImage = {
      url: draft.featuredImage.url.trim(),
      alt: draft.featuredImage.alt || '',
      caption: draft.featuredImage.caption || ''
    };
  }

  // tags/categories - only send valid data
  payload.tags = (draft.tags || []).filter(Boolean);
  payload.categories = (draft.categories || []).filter(isId);

  // seo - only send if we have data, use both shapes for compatibility
  if (draft.seoTitle || draft.metaDescription) {
    payload.seo = {
      title: draft.seoTitle || '',
      description: draft.metaDescription || '',
      metaTitle: draft.seoTitle || '',
      metaDescription: draft.metaDescription || ''
    };
  }

  return payload;
};

interface SimplePostDraft {
  title: string;
  slug: string;
  content: string;
  featuredImage: {
    url: string;
    alt?: string;
    caption?: string;
  };
  tags: string[];
  categories: string[];
  seoTitle?: string;
  metaDescription?: string;
  status: 'draft' | 'review' | 'published' | 'archived';
}

interface UseSimplePostAutosaveOptions {
  draft: SimplePostDraft;
  postId: string;
  setPostId: (id: string) => void;
  delay?: number;
  onSave?: () => void;
  onError?: (error: string) => void;
}

export const useSimplePostAutosave = ({
  draft,
  postId,
  setPostId,
  delay = 1000, // Reduced delay like advanced posts
  onSave,
  onError
}: UseSimplePostAutosaveOptions) => {
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const firstRun = useRef(true); // Add StrictMode handling
  const { showSnackbar } = useSnackbar();

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  // Debounced autosave effect - using advanced post pattern
  useEffect(() => {
    // Avoid StrictMode double-run triggering immediate save on mount
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsAutoSaving(true);
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        if (!postId) {
          // Skip autosave if no meaningful content - require both title AND content for autosave
          const hasTitle = !!draft.title?.trim();
          const hasContent = !!draft.content?.trim();
          
          if (!hasTitle || !hasContent) {
            console.log('useSimplePostAutosave: Skipping autosave - missing title or content', {
              hasTitle,
              hasContent
            });
            return;
          }

          // Skip autosave if we just had a validation error (prevent infinite loops)
          if (lastError && lastError.includes('Validation failed')) {
            console.log('useSimplePostAutosave: Skipping autosave due to recent validation error');
            return;
          }

          // Build robust payload for create
          const backendDraft = buildPayload(draft, true);

          // Check payload size to prevent BSON errors
          const payloadSize = JSON.stringify(backendDraft).length;
          if (payloadSize > 5 * 1024 * 1024) { // 5MB limit
            console.warn('Payload too large for autosave, skipping:', payloadSize, 'bytes');
            return;
          }

          console.log('useSimplePostAutosave: Creating new simple post:', {
            title: backendDraft.title,
            slug: backendDraft.slug,
            contentLength: backendDraft.content?.length || 0,
            hasFeaturedImage: !!backendDraft.featuredImage?.url,
            categoriesCount: backendDraft.categories?.length || 0
          });

          const response = await fetch('/api/admin/simple-posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendDraft),
            signal: abortRef.current.signal,
          });

          if (response.ok) {
            const result = await response.json();
            const newPostId = result.data._id || result.data.id;
            setPostId(newPostId);
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            setLastError(null); // Clear any previous errors
            onSave?.();
            console.log('useSimplePostAutosave: Created new simple post with ID:', newPostId);
          } else {
            const errorData = await parseError(response);
            console.error('useSimplePostAutosave: Create failed:', {
              status: response.status,
              statusText: response.statusText,
              errorData,
              backendDraft
            });
            console.error('Full validation error details:', JSON.stringify(errorData, null, 2));
            const errorMessage = errorData.error || errorData.message || `Failed to create draft (${response.status})`;
            setLastError(errorMessage);
            onError?.(errorMessage);
            return;
          }
        } else {
          // Skip autosave if no meaningful content - require both title AND content for autosave
          const hasTitle = !!draft.title?.trim();
          const hasContent = !!draft.content?.trim();
          
          if (!hasTitle || !hasContent) {
            console.log('useSimplePostAutosave: Skipping autosave - missing title or content', {
              hasTitle,
              hasContent
            });
            return;
          }

          // Skip autosave if we just had a validation error (prevent infinite loops)
          if (lastError && lastError.includes('Validation failed')) {
            console.log('useSimplePostAutosave: Skipping autosave due to recent validation error');
            return;
          }

          // Build robust payload for update
          const backendDraft = buildPayload(draft, false);

          // Check payload size to prevent BSON errors
          const payloadSize = JSON.stringify(backendDraft).length;
          if (payloadSize > 5 * 1024 * 1024) { // 5MB limit
            console.warn('Payload too large for autosave, skipping:', payloadSize, 'bytes');
            return;
          }

          console.log('useSimplePostAutosave: Updating existing simple post:', {
            postId,
            title: backendDraft.title,
            slug: backendDraft.slug,
            contentLength: backendDraft.content?.length || 0,
            hasFeaturedImage: !!backendDraft.featuredImage?.url,
            categoriesCount: backendDraft.categories?.length || 0
          });

          const response = await fetch(`/api/admin/simple-posts/${postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendDraft),
            signal: abortRef.current.signal,
          });

          if (response.ok) {
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            setLastError(null); // Clear any previous errors
            onSave?.();
            console.log('useSimplePostAutosave: Updated simple post successfully');
          } else {
            const errorData = await parseError(response);
            
            // If post not found (404), clear the postId to create a new draft
            if (response.status === 404) {
              console.log('Simple post not found, clearing postId to create new draft');
              setPostId('');
              localStorage.removeItem('draft:new-simple-post');
              return;
            }

            console.error('useSimplePostAutosave: Update failed:', {
              status: response.status,
              statusText: response.statusText,
              errorData,
              backendDraft,
              fullErrorData: JSON.stringify(errorData, null, 2)
            });
            const errorMessage = errorData.error || errorData.message || `Failed to update draft (${response.status})`;
            setLastError(errorMessage);
            onError?.(errorMessage);
            return;
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Request was aborted, don't show error
        }
        console.error('useSimplePostAutosave: Error in autosave:', error);
        onError?.(error instanceof Error ? error.message : 'Failed to save draft');
      } finally {
        setIsAutoSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [draft, delay, postId, setPostId, onSave, onError]);

  // Update hasUnsavedChanges based on content
  useEffect(() => {
    const hasContent = !!(draft.title.trim() || draft.content.trim() || draft.featuredImage?.url?.trim());
    setHasUnsavedChanges(hasContent);
  }, [draft.title, draft.content, draft.featuredImage?.url]);

  // Save draft manually
  const saveDraftManually = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    try {
      setIsAutoSaving(true);
      
      if (!postId) {
        // Create new simple post
        const generateUniqueSlug = () => {
          if (draft.title && draft.title.trim()) {
            return draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          }
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 8);
          return `simple-draft-${timestamp}-${randomString}`;
        };

        const backendDraft = {
          title: draft.title || '',
          slug: draft.slug || generateUniqueSlug(),
          content: draft.content || '',
          featuredImage: draft.featuredImage || { url: '', alt: '', caption: '' },
          tags: draft.tags || [],
          categories: (draft.categories || []).filter(id => id && id.trim() !== ''),
          seo: {
            metaTitle: draft.seoTitle || '',
            metaDescription: draft.metaDescription || ''
          },
          status: 'draft'
        };

        const response = await fetch('/api/admin/simple-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backendDraft),
        });

        if (response.ok) {
          const result = await response.json();
          const newPostId = result.data._id || result.data.id;
          setPostId(newPostId);
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          onSave?.();
          return newPostId;
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || 'Failed to create draft');
        }
      } else {
        // Update existing simple post
        const backendDraft = {
          title: draft.title || '',
          slug: draft.slug || '',
          content: draft.content || '',
          featuredImage: draft.featuredImage || { url: '', alt: '', caption: '' },
          tags: draft.tags || [],
          categories: (draft.categories || []).filter(id => id && id.trim() !== ''),
          seo: {
            metaTitle: draft.seoTitle || '',
            metaDescription: draft.metaDescription || ''
          },
          status: 'draft'
        };

        const response = await fetch(`/api/admin/simple-posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backendDraft),
        });

        if (response.ok) {
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          onSave?.();
          return postId;
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || 'Failed to update draft');
        }
      }
    } catch (error) {
      console.error('useSimplePostAutosave: Manual save failed:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to save draft');
      throw error;
    } finally {
      setIsAutoSaving(false);
    }
  }, [draft, postId, setPostId, onSave, onError]);

  return {
    isAutoSaving,
    lastSaved,
    hasUnsavedChanges,
    saveDraftManually
  };
};
