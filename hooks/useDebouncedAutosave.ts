import { useEffect, useRef } from 'react';

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
            tags: (draft as any).tags || [],
            categories: (draft as any).categories || [],
            featuredImage: (draft as any).featuredImage || '',
            contentSections: (draft as any).contentSections || [],
            status: 'review'
          };
          
          const res = await fetch('/api/admin/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendDraft),
            signal: abortRef.current.signal,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || 'Create draft failed');
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
            tags: (draft as any).tags || [],
            categories: (draft as any).categories || [],
            featuredImage: (draft as any).featuredImage || '',
            contentSections: (draft as any).contentSections || [],
            status: 'review'
          };
          
          const res = await fetch(`/api/admin/posts/${postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendDraft),
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
            
            throw new Error(errorData?.error || 'Autosave failed');
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
