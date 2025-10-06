import { useEffect, useRef } from 'react';
import { getApiUrl } from '@/lib/api-config';

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
          const backendDraft = {
            title: (draft as any).title || '',
            slug: (draft as any).slug || (draft as any).title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled',
            body: (draft as any).body || '',
            tags: Array.isArray((draft as any).tags) ? (draft as any).tags : [],
            categories: Array.isArray((draft as any).categories) ? (draft as any).categories : [],
            featuredImage: (draft as any).featuredImage || '',
            contentSections: Array.isArray((draft as any).contentSections) ? (draft as any).contentSections : [],
            status: 'draft'
          };
          
          // Skip autosave if no meaningful content
          if (!backendDraft.title.trim() && !backendDraft.body.trim() && backendDraft.contentSections.length === 0) {
            return;
          }
          
          // Check payload size to prevent BSON errors
          const payloadSize = JSON.stringify(backendDraft).length;
          if (payloadSize > 5 * 1024 * 1024) { // 5MB limit (reduced from 10MB)
            console.warn('Payload too large for autosave, skipping:', payloadSize, 'bytes');
            return;
          }
          
          // Filter out large content sections for autosave
          const filteredContentSections = backendDraft.contentSections.map(section => {
            if (section.type === 'hero' && section.backgroundImage && section.backgroundImage.length > 1000000) {
              // Remove large base64 images from autosave
              return { ...section, backgroundImage: '' };
            }
            if (section.type === 'image' && section.imageUrl && section.imageUrl.length > 1000000) {
              // Remove large base64 images from autosave
              return { ...section, imageUrl: '' };
            }
            if (section.type === 'gallery' && section.images) {
              // Remove large images from gallery autosave
              return {
                ...section,
                images: section.images.map(img => ({
                  ...img,
                  url: img.url && img.url.length > 1000000 ? '' : img.url
                }))
              };
            }
            return section;
          });
          
          // Update the draft with filtered content
          const filteredDraft = {
            ...backendDraft,
            contentSections: filteredContentSections
          };
          
          const res = await fetch(getApiUrl('admin/posts'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filteredDraft),
            signal: abortRef.current.signal,
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            
            // If validation error (400), log but don't throw
            if (res.status === 400) {
              console.warn('Validation error during draft creation:', errorData);
              return;
            }
            
            // If payload too large (413), log but don't throw
            if (res.status === 413) {
              console.warn('Payload too large for draft creation, skipping');
              return;
            }
            
            // For other errors, log but don't throw
            console.warn('Draft creation failed with status', res.status, ':', errorData);
            return;
          }
          
          const data = await res.json();
          setPostId(data._id);
          onSave?.(data._id);
          // Persist to localStorage to survive reloads
          localStorage.setItem('draft:new-post', data._id);
        } else {
          // Update existing post - only send fields the backend expects
          const backendDraft = {
            title: (draft as any).title || '',
            slug: (draft as any).slug || (draft as any).title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled',
            body: (draft as any).body || '',
            tags: Array.isArray((draft as any).tags) ? (draft as any).tags : [],
            categories: Array.isArray((draft as any).categories) ? (draft as any).categories : [],
            featuredImage: (draft as any).featuredImage || '',
            contentSections: Array.isArray((draft as any).contentSections) ? (draft as any).contentSections : [],
            status: 'review'
          };
          
          // Skip autosave if no meaningful content
          if (!backendDraft.title.trim() && !backendDraft.body.trim() && backendDraft.contentSections.length === 0) {
            return;
          }
          
          // Check payload size to prevent BSON errors
          const payloadSize = JSON.stringify(backendDraft).length;
          if (payloadSize > 5 * 1024 * 1024) { // 5MB limit (reduced from 10MB)
            console.warn('Payload too large for autosave, skipping:', payloadSize, 'bytes');
            return;
          }
          
          // Filter out large content sections for autosave
          const filteredContentSections = backendDraft.contentSections.map(section => {
            if (section.type === 'hero' && section.backgroundImage && section.backgroundImage.length > 1000000) {
              // Remove large base64 images from autosave
              return { ...section, backgroundImage: '' };
            }
            if (section.type === 'image' && section.imageUrl && section.imageUrl.length > 1000000) {
              // Remove large base64 images from autosave
              return { ...section, imageUrl: '' };
            }
            if (section.type === 'gallery' && section.images) {
              // Remove large images from gallery autosave
              return {
                ...section,
                images: section.images.map(img => ({
                  ...img,
                  url: img.url && img.url.length > 1000000 ? '' : img.url
                }))
              };
            }
            return section;
          });
          
          // Update the draft with filtered content
          const filteredDraft = {
            ...backendDraft,
            contentSections: filteredContentSections
          };
          
          const res = await fetch(getApiUrl(`admin/posts/${postId}`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filteredDraft),
            signal: abortRef.current.signal,
          });
          if (!res.ok) {
            const errorData = await res.json();
            
            // If post not found (404), clear the postId to create a new draft
            if (res.status === 404) {
              console.log('Post not found, clearing postId to create new draft');
              setPostId('');
              localStorage.removeItem('draft:new-post');
              return; // Don't throw error, just stop autosave
            }
            
            // If rate limited (429), just skip this autosave attempt
            if (res.status === 429) {
              console.log('Rate limited, skipping autosave');
              return; // Don't throw error, just skip this attempt
            }
            
            // If validation error (400), log but don't throw to avoid spam
            if (res.status === 400) {
              console.warn('Validation error during autosave:', errorData);
              return; // Don't throw error, just skip this attempt
            }
            
            // If payload too large (413), log but don't throw
            if (res.status === 413) {
              console.warn('Payload too large for autosave, skipping this attempt');
              return; // Don't throw error, just skip this attempt
            }
            
            // For other errors, log but don't throw to avoid disrupting user experience
            console.warn('Autosave failed with status', res.status, ':', errorData);
            return; // Don't throw error, just skip this attempt
          }
          onSave?.(postId);
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('Autosave error:', error);
          onError?.(error);
        }
      }
    }, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [JSON.stringify(draft), postId, delay, setPostId, onSave, onError]);
}
