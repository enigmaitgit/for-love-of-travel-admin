import { PostDraft, PostPublish, PostSearch, BulkAction, ContentSection } from './validation';
import { getApiUrl } from './api-config';

// Typed API layer
export type Post = {
  id: string;
  title: string;
  slug: string;
  body?: string;
  contentSections: ContentSection[];
  featuredImage?: string | {
    url: string;
    alt?: string;
    caption?: string;
  };
  tags: string[];
  categories: Array<string | {
    _id: string;
    name: string;
    slug: string;
  }>;
  status: 'draft' | 'published' | 'archived' | 'review';
  author: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  isFeatured: boolean;
  readingTime: number;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  publishedAt?: Date;
  seoTitle?: string;
  metaDescription?: string;
  jsonLd?: boolean;
  breadcrumb?: {
    enabled: boolean;
    items: Array<{
      label: string;
      href: string;
    }>;
  };
  stats?: {
    views: number;
    likes: number;
    shares: number;
  };
  _id?: string;
};

export type MediaAsset = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt?: string;
  caption?: string;
  uploadedAt: Date;
  _id?: string;
};

export type ContentPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentSections: unknown[];
  status: 'draft' | 'published' | 'archived';
  seoTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  publishedAt?: Date;
  updatedAt?: Date;
  lastSyncedAt?: Date;
  _id?: string;
};

// Helper function to get author display name
function getAuthorDisplayName(author: string | { _id: string; firstName: string; lastName: string; email: string }): string {
  if (typeof author === 'string') return author;
  
  const fullName = [author.firstName, author.lastName].filter(Boolean).join(' ');
  return fullName || author.email || 'Unknown';
}

// Helper function to normalize content sections from backend
function normalizeSection(raw: unknown): ContentSection | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;

  switch (b.type) {
    case 'hero':
      // Hero section is valid even without backgroundImage or title
      return {
        type: 'hero',
        backgroundImage: b.backgroundImage && b.backgroundImage !== 'undefined' ? String(b.backgroundImage) : '',
        title: b.title && b.title !== 'undefined' ? String(b.title) : '',
        subtitle: b.subtitle && b.subtitle !== 'undefined' ? String(b.subtitle) : '',
        author: b.author && b.author !== 'undefined' ? String(b.author) : '',
        publishDate: b.publishDate && b.publishDate !== 'undefined' ? String(b.publishDate) : '',
        readTime: b.readTime && b.readTime !== 'undefined' ? String(b.readTime) : '',
        overlayOpacity: Number(b.overlayOpacity ?? 0.4),
        height: (b.height as { mobile: string; tablet: string; desktop: string }) ?? { mobile: '320px', tablet: '420px', desktop: '520px' },
        titleSize: (b.titleSize as { mobile: string; tablet: string; desktop: string }) ?? { mobile: '28px', tablet: '36px', desktop: '48px' },
        parallaxEnabled: Boolean(b.parallaxEnabled ?? false),
        parallaxSpeed: Number(b.parallaxSpeed ?? 1),
        backgroundPosition: (b.backgroundPosition as 'center' | 'top' | 'bottom' | 'left' | 'right') ?? 'center',
        backgroundSize: (b.backgroundSize as 'cover' | 'contain') ?? 'cover',
        animation: (b.animation as { enabled: boolean; type: 'fadeIn' | 'slideUp' | 'scaleIn' | 'none'; duration: number; delay: number }) ?? {
          enabled: false,
          type: 'fadeIn',
          duration: 0.5,
          delay: 0
        },
        socialSharing: (b.socialSharing as { enabled: boolean; platforms: ('facebook' | 'twitter' | 'linkedin' | 'copy' | 'share')[]; position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'; style: 'glass' | 'solid' | 'outline' }) ?? {
          enabled: false,
          platforms: ['facebook', 'twitter', 'linkedin'],
          position: 'bottom-right',
          style: 'glass'
        }
      };
    case 'text':
      // Text section is valid even without content
      return {
        type: 'text',
        content: b.content ? String(b.content) : '',
        hasDropCap: Boolean(b.hasDropCap ?? false),
        alignment: (b.alignment as 'left' | 'center' | 'right' | 'justify') ?? 'left',
        fontSize: (b.fontSize as 'sm' | 'base' | 'lg' | 'xl') ?? 'base',
        fontFamily: (b.fontFamily as 'inter' | 'serif' | 'sans' | 'mono') ?? 'inter',
        lineHeight: (b.lineHeight as 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose') ?? 'normal',
        dropCap: (b.dropCap as { enabled: boolean; size: 'text-4xl' | 'text-5xl' | 'text-6xl'; color: string; fontWeight: 'normal' | 'medium' | 'semibold' | 'bold'; float: boolean }) ?? {
          enabled: false,
          size: 'text-4xl',
          color: '#000000',
          fontWeight: 'normal',
          float: false
        },
        // spacing: (b.spacing as { top: number; bottom: number }) ?? { top: 0, bottom: 0 },
        // backgroundColor: b.backgroundColor ? String(b.backgroundColor) : undefined,
        // textColor: b.textColor ? String(b.textColor) : undefined,
        // border: (b.border as { enabled: boolean; width: number; color: string; radius: number; style: 'solid' | 'dashed' | 'dotted' }) ?? {
        //   enabled: false,
        //   width: 1,
        //   color: '#000000',
        //   radius: 0,
        //   style: 'solid'
        // }
      };
    case 'image':
      // Image section is valid even without imageUrl
      return {
        type: 'image',
        imageUrl: String(b.imageUrl || b.src),
        altText: b.altText || b.alt ? String(b.altText || b.alt) : undefined,
        caption: b.caption ? String(b.caption) : undefined,
        width: b.width ? Number(b.width) : undefined,
        height: b.height ? Number(b.height) : undefined,
        alignment: (b.alignment as 'left' | 'center' | 'right') ?? 'center',
        rounded: Boolean(b.rounded ?? false),
        shadow: Boolean(b.shadow ?? false)
      };
    case 'gallery':
      // Gallery section is valid even without images
      return {
        type: 'gallery',
        images: Array.isArray(b.images) ? b.images.map((img: unknown) => {
          const imgData = img as { url?: string; src?: string; altText?: string; alt?: string; caption?: string; width?: number; height?: number };
          return {
            url: String(imgData.url || imgData.src),
            altText: imgData.altText || imgData.alt ? String(imgData.altText || imgData.alt) : undefined,
            caption: imgData.caption ? String(imgData.caption) : undefined,
            width: imgData.width ? Number(imgData.width) : undefined,
            height: imgData.height ? Number(imgData.height) : undefined
          };
        }) : [],
        layout: (b.layout as 'grid' | 'masonry' | 'carousel' | 'postcard' | 'complex') ?? 'grid',
        columns: Number(b.columns ?? 3),
        spacing: (b.spacing as 'sm' | 'md' | 'lg') ?? 'md',
        responsive: {
          mobile: { layout: 'grid', columns: 1 },
          desktop: { layout: 'grid', columns: 3 }
        },
        hoverEffects: {
          enabled: true,
          scale: 1.05,
          shadow: true,
          overlay: true
        },
        animation: {
          enabled: true,
          type: 'fadeIn',
          duration: 0.5,
          stagger: 0.1
        }
      };
    case 'popular-posts':
      return {
        type: 'popular-posts',
        title: b.title && b.title !== 'undefined' ? String(b.title) : 'Popular Posts',
        description: b.description && b.description !== 'undefined' ? String(b.description) : '',
        featuredPost: b.featuredPost ? {
          title: (b.featuredPost as Record<string, unknown>).title && (b.featuredPost as Record<string, unknown>).title !== 'undefined' ? String((b.featuredPost as Record<string, unknown>).title) : '',
          excerpt: (b.featuredPost as Record<string, unknown>).excerpt && (b.featuredPost as Record<string, unknown>).excerpt !== 'undefined' ? String((b.featuredPost as Record<string, unknown>).excerpt) : '',
          imageUrl: (b.featuredPost as Record<string, unknown>).imageUrl && (b.featuredPost as Record<string, unknown>).imageUrl !== 'undefined' ? String((b.featuredPost as Record<string, unknown>).imageUrl) : '',
          readTime: (b.featuredPost as Record<string, unknown>).readTime && (b.featuredPost as Record<string, unknown>).readTime !== 'undefined' ? String((b.featuredPost as Record<string, unknown>).readTime) : '',
          publishDate: (b.featuredPost as Record<string, unknown>).publishDate && (b.featuredPost as Record<string, unknown>).publishDate !== 'undefined' ? String((b.featuredPost as Record<string, unknown>).publishDate) : '',
          category: (b.featuredPost as Record<string, unknown>).category && (b.featuredPost as Record<string, unknown>).category !== 'undefined' ? String((b.featuredPost as Record<string, unknown>).category) : ''
        } : {
          title: '',
          excerpt: '',
          imageUrl: '',
          readTime: '',
          publishDate: '',
          category: ''
        },
        sidePosts: Array.isArray(b.sidePosts) ? b.sidePosts.map((post: unknown) => {
          const postData = post as { title?: string; excerpt?: string; imageUrl?: string; readTime?: string; publishDate?: string };
          return {
            title: postData.title && postData.title !== 'undefined' ? String(postData.title) : '',
            excerpt: postData.excerpt && postData.excerpt !== 'undefined' ? String(postData.excerpt) : '',
            imageUrl: postData.imageUrl && postData.imageUrl !== 'undefined' ? String(postData.imageUrl) : '',
            readTime: postData.readTime && postData.readTime !== 'undefined' ? String(postData.readTime) : '',
            publishDate: postData.publishDate && postData.publishDate !== 'undefined' ? String(postData.publishDate) : ''
          };
        }) : []
      };
    case 'breadcrumb':
      return {
        type: 'breadcrumb',
        enabled: true,
        items: Array.isArray(b.items) ? b.items.map((item: unknown) => {
          const itemData = item as { label?: string; href?: string };
          return {
            label: String(itemData.label || ''),
            href: String(itemData.href || '')
          };
        }) : [],
        style: {
          separator: '>',
          textSize: 'sm',
          showHomeIcon: true,
          color: 'gray'
        }
      };
    default:
      return null;
  }
}

// Transform backend post data to frontend format
export function transformBackendPost(post: unknown): Post {
  const postData = post as {
    _id?: string;
    id?: string;
    title?: string;
    slug?: string;
    body?: string;
    contentSections?: unknown[];
    tags?: string[];
    categories?: unknown[];
    status?: string;
    author?: string;
    isFeatured?: boolean;
    readingTime?: number;
    calculatedReadingTime?: number;
    createdAt?: string;
    updatedAt?: string;
    scheduledAt?: string;
    publishedAt?: string;
    seoTitle?: string;
    metaDescription?: string;
    jsonLd?: boolean;
    breadcrumb?: unknown;
    stats?: unknown;
    featuredImage?: unknown;
  };
  
  return {
    id: postData._id || postData.id || '',
    _id: postData._id || '',
    title: postData.title || '',
    slug: postData.slug || '',
    body: postData.body || '',
    contentSections: Array.isArray(postData.contentSections)
      ? ((postData.contentSections as unknown[])
          .map(normalizeSection)                // -> ContentSection | null
          .filter(Boolean)) as ContentSection[] // narrow to ContentSection[]
      : [],
    tags: postData.tags || [],
    categories: Array.isArray(postData.categories) 
      ? postData.categories.map((cat: unknown) => {
          if (typeof cat === 'string') return cat;
          // If it's a populated object, return the object with name
          const catData = cat as { name?: string; _id?: string; id?: string; slug?: string };
          if (catData && typeof catData === 'object' && catData.name) {
            return {
              _id: catData._id || catData.id || '',
              name: catData.name,
              slug: catData.slug || catData.name?.toLowerCase().replace(/\s+/g, '-') || ''
            };
          }
          // Fallback to ID if no name
          return catData._id || catData.id || cat;
        }) as Array<string | { _id: string; name: string; slug: string }>
      : [],
    status: (postData.status as 'draft' | 'published' | 'archived' | 'review') || 'draft',
    author: postData.author || 'Unknown',
    isFeatured: postData.isFeatured || false,
    readingTime: postData.readingTime || postData.calculatedReadingTime || 0,
    createdAt: new Date(postData.createdAt || new Date().toISOString()),
    updatedAt: new Date(postData.updatedAt || new Date().toISOString()),
    scheduledAt: postData.scheduledAt ? new Date(postData.scheduledAt) : undefined,
    publishedAt: postData.publishedAt ? new Date(postData.publishedAt) : undefined,
    seoTitle: postData.seoTitle || '',
    metaDescription: postData.metaDescription || '',
    jsonLd: postData.jsonLd || false,
    breadcrumb: postData.breadcrumb ? {
      enabled: true,
      items: [
        { label: 'Home', href: '/' },
        { label: 'Destinations', href: '#destinations' }
      ]
    } : undefined,
    stats: postData.stats ? {
      views: 0,
      likes: 0,
      shares: 0
    } : undefined,
    featuredImage: postData.featuredImage ? (
      typeof postData.featuredImage === 'string' 
        ? postData.featuredImage 
        : {
            url: (postData.featuredImage as { url?: string }).url || '',
            alt: (postData.featuredImage as { alt?: string }).alt,
            caption: (postData.featuredImage as { caption?: string }).caption
          }
    ) : undefined
  };
}

// API Error class
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API fetch function
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new ApiError(response.status, text || 'Request failed');
  }

  return response;
}

// Get a single post by ID
export async function getPost(id: string): Promise<Post | null> {
  try {
    // Guard: Fail fast if ID is invalid
    const sanitizedId = id?.toString().trim();
    
    if (!sanitizedId || 
        sanitizedId === 'undefined' || 
        sanitizedId === 'null' || 
        sanitizedId === '' ||
        sanitizedId.length < 24) { // MongoDB ObjectId should be at least 24 chars
      console.error('🚫 getPost Guard: Invalid post ID:', { 
        original: id, 
        sanitized: sanitizedId,
        type: typeof id 
      });
      throw new Error(`Invalid post ID: ${id}`);
    }
    
    const response = await apiFetch(getApiUrl(`admin/posts/${sanitizedId}`));
    const data = await response.json();
    
    if (data.success && data.data) {
      return transformBackendPost(data.data);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Get posts with search and filtering
export async function getPosts(searchParams: Partial<PostSearch> = {}): Promise<{ posts: Post[]; total: number }> {
  try {
    const params = new URLSearchParams();
    
    if (searchParams.search) params.append('search', searchParams.search);
    if (searchParams.status) params.append('status', searchParams.status);
    if (searchParams.author) params.append('author', searchParams.author);
    if (searchParams.dateFrom) params.append('dateFrom', searchParams.dateFrom);
    if (searchParams.dateTo) params.append('dateTo', searchParams.dateTo);
    if (searchParams.page) params.append('page', searchParams.page.toString());
    if (searchParams.limit) params.append('limit', searchParams.limit.toString());
    
    const response = await apiFetch(getApiUrl(`admin/posts?${params.toString()}`));
    const data = await response.json();
    
    if (data.success && data.data) {
      const posts = data.data.posts.map(transformBackendPost);
      return {
        posts,
        total: data.data.total || posts.length
      };
    }
    
    return { posts: [], total: 0 };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], total: 0 };
  }
}

// Create a new post
export async function createPost(draft: PostDraft): Promise<{ id: string }> {
  try {
    const response = await apiFetch(getApiUrl('admin/posts'), {
      method: 'POST',
      body: JSON.stringify(draft),
    });
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return { id: data.data._id || data.data.id };
    }
    
    throw new Error('Failed to create post');
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

// Update an existing post
export async function updatePost(id: string, draft: PostDraft): Promise<Post> {
  try {
    const response = await apiFetch(getApiUrl(`admin/posts/${id}`), {
      method: 'PATCH',
      body: JSON.stringify(draft),
    });
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return transformBackendPost(data.data);
    }
    
    throw new Error('Failed to update post');
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

// Delete a post
export async function deletePost(id: string): Promise<boolean> {
  try {
    const response = await apiFetch(getApiUrl(`admin/posts/${id}`), {
      method: 'DELETE',
    });
    
    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
}

// Publish a post
export async function publishPost(id: string, publishData: PostPublish): Promise<Post> {
  try {
    const response = await apiFetch(getApiUrl(`admin/posts/${id}/publish`), {
      method: 'PUT',
      body: JSON.stringify(publishData),
    });
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return transformBackendPost(data.data);
    }
    
    throw new Error('Failed to publish post');
  } catch (error) {
    console.error('Error publishing post:', error);
    throw error;
  }
}

// Bulk operations
export async function bulkUpdatePosts(ids: string[], updates: Partial<PostDraft>): Promise<{ success: number; failed: number }> {
  try {
    const response = await apiFetch(getApiUrl('admin/posts/bulk'), {
      method: 'PATCH',
      body: JSON.stringify({ ids, updates }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: data.data?.success || 0,
        failed: data.data?.failed || 0
      };
    }
    
    return { success: 0, failed: ids.length };
  } catch (error) {
    console.error('Error bulk updating posts:', error);
    return { success: 0, failed: ids.length };
  }
}

export async function bulkDeletePosts(ids: string[]): Promise<{ success: number; failed: number }> {
  try {
    const response = await apiFetch(getApiUrl('admin/posts/bulk'), {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: data.data?.success || 0,
        failed: data.data?.failed || 0
      };
    }
    
    return { success: 0, failed: ids.length };
  } catch (error) {
    console.error('Error bulk deleting posts:', error);
    return { success: 0, failed: ids.length };
  }
}

// Media operations
export async function getMediaAssets(): Promise<MediaAsset[]> {
  try {
    const response = await apiFetch(getApiUrl('admin/media'));
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data.map((asset: unknown) => {
        const assetData = asset as {
          _id?: string;
          id?: string;
          filename?: string;
          originalName?: string;
          mimeType?: string;
          size?: number;
          url?: string;
          alt?: string;
          caption?: string;
          uploadedAt?: string;
        };
        return {
          id: assetData._id || assetData.id || '',
          _id: assetData._id || '',
          filename: assetData.filename || '',
          originalName: assetData.originalName || '',
          mimeType: assetData.mimeType || '',
          size: assetData.size || 0,
          url: assetData.url || '',
          alt: assetData.alt || '',
          caption: assetData.caption || '',
          uploadedAt: new Date(assetData.uploadedAt || new Date().toISOString())
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching media assets:', error);
    return [];
  }
}

export async function uploadMedia(file: File): Promise<MediaAsset> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(getApiUrl('admin/media'), {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        id: data.data._id || data.data.id,
        _id: data.data._id,
        filename: data.data.filename,
        originalName: data.data.originalName,
        mimeType: data.data.mimeType,
        size: data.data.size,
        url: data.data.url,
        alt: data.data.alt,
        caption: data.data.caption,
        uploadedAt: new Date(data.data.uploadedAt)
      };
    }
    
    throw new Error('Upload failed');
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

export async function deleteMediaAsset(id: string): Promise<boolean> {
  try {
    const response = await apiFetch(getApiUrl(`admin/media/${id}`), {
      method: 'DELETE',
    });
    
    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error('Error deleting media asset:', error);
    return false;
  }
}

// Categories
export async function getCategories(): Promise<Array<{ _id: string; name: string; slug: string; postCount?: number }>> {
  try {
    const response = await apiFetch(getApiUrl('v1/categories?includePostCount=true'));
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function createCategory(name: string): Promise<{ _id: string; name: string; slug: string }> {
  try {
    const response = await apiFetch(getApiUrl('v1/categories'), {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }
    
    throw new Error('Failed to create category');
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}
