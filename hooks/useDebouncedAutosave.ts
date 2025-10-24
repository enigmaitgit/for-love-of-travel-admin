import { useEffect, useRef } from 'react';
import { ContentSection } from '@/lib/validation';

interface UseDebouncedAutosaveOptions<T extends object> {
  draft: T;
  postId: string | null;
  setPostId: (id: string) => void;
  delay?: number;
  onSave?: (postId: string) => void;
  onError?: (error: Error) => void;
}

export function useDebouncedAutosave<T extends object>({
  draft,
  postId,
  setPostId,
  delay = 1000,
  onSave,
  onError,
}: UseDebouncedAutosaveOptions<T>) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    // Avoid StrictMode double-run triggering immediate save on mount
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        if (!postId) {
          // Create new post - only send fields the backend expects
          // Generate unique slug for drafts without titles to prevent overwrites
          const generateUniqueSlug = () => {
            if ((draft as any).title && (draft as any).title.trim()) {
              return (draft as any).title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
            // Create unique slug for untitled drafts using timestamp and random string
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 8);
            const uniqueSlug = `draft-${timestamp}-${randomString}`;
            console.log('useDebouncedAutosave: Generating unique slug for untitled draft:', uniqueSlug);
            return uniqueSlug;
          };

          const backendDraft = {
            title: (draft as any).title || '',
            slug: (draft as any).slug || generateUniqueSlug(),
            body: (draft as any).body || '',
            tags: Array.isArray((draft as any).tags) ? (draft as any).tags : [],
            categories: Array.isArray((draft as any).categories) ? (draft as any).categories : [],
            featuredImage: (() => {
              // Check if featuredImage is a non-empty string
              if (typeof (draft as any).featuredImage === 'string' && (draft as any).featuredImage.trim()) {
                return (draft as any).featuredImage;
              }
              // Check if featuredImage is an object with URL
              if ((draft as any).featuredImage?.url) {
                return (draft as any).featuredImage.url;
              }
              return '';
            })(),
            featuredMedia: (draft as any).featuredMedia || undefined,
            contentSections: Array.isArray((draft as any).contentSections) ? (draft as any).contentSections : [],
            status: 'draft'
          };
          
          // Ensure featuredImage is a string for validation
          if (typeof backendDraft.featuredImage === 'object') {
            backendDraft.featuredImage = backendDraft.featuredImage?.url || '';
          }
          
          console.log('useDebouncedAutosave: Creating new post with content sections:', {
            contentSectionsCount: backendDraft.contentSections.length,
            contentSections: backendDraft.contentSections,
            featuredImage: backendDraft.featuredImage,
            featuredMedia: backendDraft.featuredMedia,
            title: backendDraft.title,
            slug: backendDraft.slug
          });
          
          // Debug: Log the raw draft data to see what's actually being passed
          console.log('useDebouncedAutosave: Raw draft data (create):', {
            featuredImage: (draft as any).featuredImage,
            featuredMedia: (draft as any).featuredMedia,
            featuredImageType: typeof (draft as any).featuredImage,
            featuredMediaType: typeof (draft as any).featuredMedia,
            featuredMediaUrl: (draft as any).featuredMedia?.url,
            finalFeaturedImage: backendDraft.featuredImage,
            finalFeaturedMedia: backendDraft.featuredMedia,
            fullDraft: draft
          });

          const response = await fetch('/api/admin/posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(backendDraft),
            signal: abortRef.current.signal
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
          }

          const result = await response.json();
          console.log('useDebouncedAutosave: Create response:', result);
          
          if (result._id || result.id) {
            const newPostId = result._id || result.id;
            setPostId(newPostId);
            onSave?.(newPostId);
            console.log('useDebouncedAutosave: New post created with ID:', newPostId);
          }
        } else {
          // Update existing post
          const updateData = {
            ...draft,
            contentSections: Array.isArray((draft as any).contentSections) ? (draft as any).contentSections : [],
          };

          // Ensure featuredImage and featuredVideo are properly formatted
          if (typeof (updateData as any).featuredImage === 'object') {
            (updateData as any).featuredImage = (updateData as any).featuredImage?.url || '';
          }
          if (typeof (updateData as any).featuredVideo === 'object') {
            (updateData as any).featuredVideo = (updateData as any).featuredVideo?.url || '';
          }

          console.log('useDebouncedAutosave: Updating existing post with ID:', postId);
          console.log('useDebouncedAutosave: Update data:', updateData);
          console.log('useDebouncedAutosave: Author field:', (updateData as any).author);

          const response = await fetch(`/api/admin/posts/${postId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
            signal: abortRef.current.signal
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
          }

          const result = await response.json();
          console.log('useDebouncedAutosave: Update response:', result);
          onSave?.(postId);
        }
      } catch (error) {
        console.error('useDebouncedAutosave: Error:', error);
        if (error instanceof Error && error.name !== 'AbortError') {
          onError?.(error);
        }
      }
    }, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch (error) {
          // Ignore abort errors - they're expected when component unmounts
          console.debug('AbortController already aborted:', error);
        }
      }
    };
  }, [draft, postId, setPostId, delay, onSave, onError]);
}
