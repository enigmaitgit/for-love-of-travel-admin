import { PostDraft, PostPublish, PostSearch, BulkAction, ContentSection } from './validation';
import { loadPosts, savePosts, loadMediaAssets, saveMediaAssets } from './persistence';
import { getApiUrl } from './api-config';

// Typed API layer
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type Query = Record<string, string | number | boolean | undefined>;

export type ApiHeaders = Record<string, string>;

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`API Error ${status}`);
    this.name = 'ApiError';
  }
}

function toQueryString(q?: Query) {
  if (!q) return '';
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.append(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

/**
 * Generic JSON fetcher without `any`
 * - TResponse: the JSON shape you expect back
 * - TBody: the JSON you send (if any)
 */
export async function apiFetch<TResponse, TBody = undefined>(
  path: string,
  opts: {
    method?: HttpMethod;
    query?: Query;
    body?: TBody;
    headers?: ApiHeaders;
  } = {}
): Promise<TResponse> {
  const { method = 'GET', query, body, headers } = opts;

  const url = `${path}${toQueryString(query)}`;

  let safeBodyLog: string | undefined;
  try {
    safeBodyLog = body ? JSON.stringify(body) : undefined;
  } catch {
    safeBodyLog = '[unserializable-body]';
  }

  console.log('🌐 API Request:', {
    method,
    url,
    body: safeBodyLog,
  });

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    body: (body === undefined ? undefined : JSON.stringify(body)),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || 'Request failed');
  }

  // If endpoint returns no content
  if (res.status === 204) return undefined as unknown as TResponse;

  return (await res.json()) as TResponse;
}

// Author type for backend responses
type AuthorResponse = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

// Backend response types
type BackendPost = {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  body?: string;
  contentSections: unknown[];
  featuredImage?: string | {
    url: string;
    alt?: string;
    caption?: string;
  };
  breadcrumb?: {
    enabled: boolean;
    items: Array<{ label: string; href: string }>;
  };
  tags: string[];
  categories: string[];
  status: 'draft' | 'review' | 'scheduled' | 'published';
  author: string | AuthorResponse;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledAt?: string;
  jsonLd?: boolean;
};

type BackendPostListResponse = {
  success: boolean;
  data: BackendPost[];
  total: number;
  count: number;
  page: number;
  pages: number;
};

type BackendPostResponse = {
  success: boolean;
  data: BackendPost;
};

type BackendCreatePostResponse = {
  success: boolean;
  data: BackendPost;
};

type BackendUpdatePostResponse = {
  success: boolean;
  data: BackendPost;
};

type BackendDeletePostResponse = {
  success: boolean;
};

// Helper function to transform author data
function transformAuthor(author: string | AuthorResponse | null): string {
  if (typeof author === 'string') {
    return author;
  }

  if (!author) {
    return 'Unknown Author';
  }

  const firstName = author.firstName || '';
  const lastName = author.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || author.email || 'Unknown';
}

// Helper function to normalize content sections from backend
function normalizeSection(raw: unknown): ContentSection | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;

  switch (b.type) {
    case 'hero':
      // Allow hero sections even with empty fields - they can be filled later
      return {
        type: 'hero',
        backgroundImage: b.backgroundImage && b.backgroundImage !== 'undefined' ? String(b.backgroundImage) : '',
        title: b.title && b.title !== 'undefined' ? String(b.title) : '',
        subtitle: b.subtitle && b.subtitle !== 'undefined' ? String(b.subtitle) : '',
        author: b.author && b.author !== 'undefined' ? String(b.author) : '',
        publishDate: b.publishDate && b.publishDate !== 'undefined' ? String(b.publishDate) : '',
        readTime: b.readTime && b.readTime !== 'undefined' ? String(b.readTime) : '',
        overlayOpacity: Number(b.overlayOpacity ?? 0.4),
        height: (b.height as { mobile: string; tablet: string; desktop: string }) ?? { mobile: '70vh', tablet: '80vh', desktop: '90vh' },
        titleSize: (b.titleSize as { mobile: string; tablet: string; desktop: string }) ?? { mobile: 'text-3xl', tablet: 'text-5xl', desktop: 'text-6xl' },
        parallaxEnabled: Boolean(b.parallaxEnabled ?? true),
        parallaxSpeed: Number(b.parallaxSpeed ?? 0.5),
        backgroundPosition: (b.backgroundPosition as 'center' | 'top' | 'bottom' | 'left' | 'right') ?? 'center',
        backgroundSize: (b.backgroundSize as 'cover' | 'contain') ?? 'cover',
        animation: (b.animation as { enabled: boolean; type: 'fadeIn' | 'slideUp' | 'scaleIn' | 'none'; duration: number; delay: number }) ?? {
          enabled: true,
          type: 'fadeIn',
          duration: 0.8,
          delay: 0
        },
        socialSharing: (b.socialSharing as { enabled: boolean; platforms: ('facebook' | 'twitter' | 'linkedin' | 'copy' | 'share')[]; position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'; style: 'glass' | 'solid' | 'outline' }) ?? {
          enabled: true,
          platforms: ['facebook', 'twitter', 'linkedin', 'copy'],
          position: 'bottom-right',
          style: 'glass'
        }
      };
    case 'text':
      // Allow text sections even with empty content - they can be filled later
      return {
        type: 'text',
        content: b.content && b.content !== 'undefined' ? String(b.content) : '',
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
        animation: (b.animation as { enabled: boolean; type: 'fadeIn' | 'slideUp' | 'slideInLeft' | 'slideInRight' | 'none'; duration: number; delay: number }) ?? {
          enabled: false,
          type: 'fadeIn',
          duration: 0.5,
          delay: 0
        }
      };
    case 'image':
      // Allow image sections even with empty imageUrl - they can be filled later
      return {
        type: 'image',
        imageUrl: b.imageUrl && b.imageUrl !== 'undefined' ? String(b.imageUrl) : '',
        altText: b.altText ? String(b.altText) : undefined,
        caption: b.caption ? String(b.caption) : undefined,
        width: b.width ? Number(b.width) : undefined,
        height: b.height ? Number(b.height) : undefined,
        alignment: (b.alignment as 'left' | 'center' | 'right') ?? 'center',
        rounded: Boolean(b.rounded ?? false),
        shadow: Boolean(b.shadow ?? false)
      };
    case 'gallery':
      // Allow gallery sections even with empty images array - they can be filled later
      return {
        type: 'gallery',
        images: Array.isArray(b.images) ? b.images.map((im: Record<string, unknown>) => ({
          url: im.url && im.url !== 'undefined' ? String(im.url) : '',
          altText: im.altText && im.altText !== 'undefined' ? String(im.altText) : '',
          caption: im.caption && im.caption !== 'undefined' ? String(im.caption) : '',
          width: im.width ? Number(im.width) : undefined,
          height: im.height ? Number(im.height) : undefined
        })) : [],
        layout: (b.layout as 'grid' | 'masonry' | 'carousel' | 'postcard' | 'complex') ?? 'grid',
        columns: Number(b.columns ?? 3),
        spacing: (b.spacing as 'sm' | 'md' | 'lg') ?? 'md',
        responsive: (b.responsive as { mobile: { layout: 'grid' | 'carousel'; columns: number }; desktop: { layout: 'grid' | 'masonry' | 'postcard' | 'complex'; columns: number } }) ?? {
          mobile: { layout: 'grid', columns: 2 },
          desktop: { layout: 'grid', columns: 3 }
        },
        hoverEffects: (b.hoverEffects as { enabled: boolean; scale: number; shadow: boolean; overlay: boolean }) ?? {
          enabled: false,
          scale: 1.05,
          shadow: false,
          overlay: false
        },
        animation: (b.animation as { enabled: boolean; type: 'fadeIn' | 'slideUp' | 'stagger' | 'none'; duration: number; stagger: number }) ?? {
          enabled: false,
          type: 'fadeIn',
          duration: 0.5,
          stagger: 0.1
        }
      };
    case 'popular-posts':
      // Allow popular-posts sections even with empty title - they can be filled later
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
        } : undefined,
        sidePosts: Array.isArray(b.sidePosts) ? b.sidePosts.map((post: Record<string, unknown>) => ({
          title: post.title && post.title !== 'undefined' ? String(post.title) : '',
          excerpt: post.excerpt && post.excerpt !== 'undefined' ? String(post.excerpt) : '',
          imageUrl: post.imageUrl && post.imageUrl !== 'undefined' ? String(post.imageUrl) : '',
          readTime: post.readTime && post.readTime !== 'undefined' ? String(post.readTime) : '',
          publishDate: post.publishDate && post.publishDate !== 'undefined' ? String(post.publishDate) : ''
        })) : []
      };
    case 'article':
      // Allow article sections even with empty fields - they can be filled later
      return {
        type: 'article',
        title: b.title && b.title !== 'undefined' ? String(b.title) : '',
        content: b.content && b.content !== 'undefined' ? String(b.content) : '',
        changingImages: Array.isArray(b.changingImages) 
          ? b.changingImages.map((img: unknown, index: number) => {
              const imgData = img as { url?: string; altText?: string; caption?: string; order?: number };
              return {
                url: imgData.url && imgData.url !== 'undefined' ? String(imgData.url) : '',
                altText: imgData.altText && imgData.altText !== 'undefined' ? String(imgData.altText) : '',
                caption: imgData.caption && imgData.caption !== 'undefined' ? String(imgData.caption) : '',
                order: typeof imgData.order === 'number' ? imgData.order : index
              };
            })
          : [
              { url: '', altText: '', caption: '', order: 0 },
              { url: '', altText: '', caption: '', order: 1 },
              { url: '', altText: '', caption: '', order: 2 }
            ],
        pinnedImage: b.pinnedImage 
          ? {
              url: (b.pinnedImage as Record<string, unknown>).url && (b.pinnedImage as Record<string, unknown>).url !== 'undefined' 
                ? String((b.pinnedImage as Record<string, unknown>).url) : '',
              altText: (b.pinnedImage as Record<string, unknown>).altText && (b.pinnedImage as Record<string, unknown>).altText !== 'undefined'
                ? String((b.pinnedImage as Record<string, unknown>).altText) : '',
              caption: (b.pinnedImage as Record<string, unknown>).caption && (b.pinnedImage as Record<string, unknown>).caption !== 'undefined'
                ? String((b.pinnedImage as Record<string, unknown>).caption) : ''
            }
          : { url: '', altText: '', caption: '' },
        layout: {
          imageSize: ((b.layout as Record<string, unknown>)?.imageSize as 'small' | 'medium' | 'large') ?? 'medium',
          showPinnedImage: (b.layout as Record<string, unknown>)?.showPinnedImage !== false,
          showChangingImages: (b.layout as Record<string, unknown>)?.showChangingImages !== false
        },
        animation: {
          enabled: false,
          type: 'fadeIn' as const,
          duration: 0.5,
          delay: 0
        }
      };
    case 'breadcrumb':
      // Allow breadcrumb sections even with empty items array - they can be filled later
      return {
        type: 'breadcrumb',
        enabled: Boolean(b.enabled ?? true),
        items: Array.isArray(b.items) ? b.items.map((item: Record<string, unknown>) => ({
          label: item.label && item.label !== 'undefined' ? String(item.label) : '',
          href: item.href && item.href !== 'undefined' ? String(item.href) : ''
        })) : [],
        style: (b.style as { separator: '>' | '→' | '|' | '/'; textSize: 'sm' | 'base' | 'lg'; showHomeIcon: boolean; color: 'gray' | 'blue' | 'black' }) ?? {
          separator: '>',
          textSize: 'sm',
          showHomeIcon: false,
          color: 'gray'
        }
      };
    default:
      return null;
  }
}

// Helper function to transform backend post to frontend post
function transformBackendPost(post: BackendPost): Post {
  try {
    console.log('transformBackendPost - Input post:', post);

    const transformed = {
      title: post.title,
      slug: post.slug,
      body: post.body || '',
      contentSections: Array.isArray(post.contentSections)
        ? ((post.contentSections as unknown[])
            .map(normalizeSection)                // -> ContentSection | null
            .filter(Boolean)) as ContentSection[] // narrow to ContentSection[]
        : [],
      tags: post.tags || [],
      categories: Array.isArray(post.categories)
        ? post.categories.map((cat: unknown) => {
            if (typeof cat === 'string') return cat;
            // If it's a populated object, return the object with name
            const catData = cat as { name?: string; _id?: string; id?: string };
            if (catData && typeof catData === 'object' && catData.name) {
              return catData;
            }
            // Fallback to ID if no name
            return catData._id || catData.id || cat;
          }) as string[]
        : [],
      featuredImage: post.featuredImage
        ? (typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage.url)
        : undefined,
      breadcrumb: post.breadcrumb || { enabled: true, items: [{ label: 'Home', href: '/' }] },
      jsonLd: post.jsonLd || false,
      id: post._id || post.id || '',
      author: transformAuthor(post.author),
      status: post.status,
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.updatedAt),
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : undefined,
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : undefined,
    };

    console.log('transformBackendPost - Transformed post:', transformed);
    return transformed;
  } catch (error) {
    console.error('transformBackendPost - Error transforming post:', error);
    console.error('transformBackendPost - Input post that caused error:', post);
    throw error;
  }
}

export type Post = PostDraft & {
  id: string;
  author: string;
  status: 'draft' | 'review' | 'scheduled' | 'published';
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  publishedAt?: Date;
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
  createdAt: Date;
  lastSyncedAt?: Date;
};

export type MediaAsset = {
  id: string;
  _id?: string;
  url: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  filename: string;
  alt?: string;
  caption?: string;
  uploadedAt: Date;
};

// Data stores - will be loaded from persistence
let posts = new Map<string, Post>();
let mediaAssets = new Map<string, MediaAsset>();

// Initialize with some mock data
const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Welcome to Love of Travel',
    slug: 'welcome-to-love-of-travel',
    body: 'This is our first blog post about travel adventures...',
    contentSections: [],
    breadcrumb: {
      enabled: true,
      items: [
        { label: 'Home', href: '/' },
        { label: 'Destinations', href: '#destinations' }
      ]
    },
    tags: ['travel', 'welcome'],
    categories: ['general'],
    status: 'published',
    author: 'John Doe',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    publishedAt: new Date('2024-01-15'),
    jsonLd: false,
  },
  {
    id: '2',
    title: 'Top 10 Destinations for 2024',
    slug: 'top-10-destinations-2024',
    body: 'Discover the most amazing places to visit this year...',
    contentSections: [],
    breadcrumb: {
      enabled: true,
      items: [
        { label: 'Home', href: '/' },
        { label: 'Destinations', href: '#destinations' }
      ]
    },
    tags: ['destinations', '2024', 'travel'],
    categories: ['destinations'],
    status: 'draft',
    author: 'Jane Smith',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    jsonLd: false,
  },
  {
    id: '3',
    title: 'Travel Tips for Beginners',
    slug: 'travel-tips-beginners',
    body: 'Essential advice for first-time travelers...',
    contentSections: [],
    breadcrumb: {
      enabled: true,
      items: [
        { label: 'Home', href: '/' },
        { label: 'Tips', href: '#tips' }
      ]
    },
    tags: ['tips', 'beginners'],
    categories: ['tips'],
    status: 'review',
    author: 'Mike Johnson',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    jsonLd: false,
  },
];

const mockMedia: MediaAsset[] = [
  // No preloaded media - start with empty library
];

// Initialize mock data after loading from persistence
async function initializeMockData() {
  try {
    console.log('Initializing mock data...');

    const loadedPosts = await loadPosts();
    const loadedMedia = await loadMediaAssets();

    console.log('Loaded posts:', loadedPosts.size);
    console.log('Loaded media:', loadedMedia.size);

    // Load existing data
    posts = loadedPosts;
    mediaAssets = loadedMedia;

    // Only add mock data if no data exists
    if (loadedPosts.size === 0) {
      console.log('Adding mock posts...');
      mockPosts.forEach(post => posts.set(post.id, post));
      await savePosts(posts);
    }

    if (loadedMedia.size === 0) {
      console.log('Adding mock media...');
      mockMedia.forEach(asset => mediaAssets.set(asset.id, asset));
      await saveMediaAssets(mediaAssets);
    }

    console.log('Mock data initialization completed');
  } catch (error) {
    console.error('Error initializing mock data:', error);
    // Initialize with empty data if loading fails
    posts = new Map();
    mediaAssets = new Map();
  }
}

// Track initialization state
let isInitialized = false;
let initError: Error | null = null;

const initPromise = initializeMockData().then(() => {
  isInitialized = true;
  console.log('Data initialization completed successfully');
}).catch((error) => {
  console.error('Data initialization failed:', error);
  initError = error;
  isInitialized = true; // Mark as initialized even if failed to prevent infinite waiting
});

// Wait for initialization to complete
async function ensureInitialized() {
  if (!isInitialized) {
    await initPromise;
  }

  if (initError) {
    console.warn('Data initialization had errors, but continuing with empty data');
  }
}

// Posts API
export async function createPost(data: PostDraft): Promise<{ id: string }> {
  try {
    console.log('Admin Panel: Creating post with data:', data);

    const res = await apiFetch<BackendCreatePostResponse, PostDraft>(
      getApiUrl('admin/posts'),
      {
        method: 'POST',
        body: data,
      }
    );

    const created = (res?.data ?? res);
    console.log('Admin Panel: Post created successfully:', created);
    return { id: created._id ?? created.id };
  } catch (error) {
    console.error('Admin Panel: Error creating post:', error);
    // Fallback to mock data if backend is not available
    await ensureInitialized();
    const id = Math.random().toString(36).substr(2, 9);
    const post: Post = {
      ...data,
      id,
      author: 'Current User',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    posts.set(id, post);
    await savePosts(posts);
    return { id };
  }
}

export async function getPosts(searchParams: PostSearch): Promise<{ rows: Post[]; total: number; page: number; pages: number; count: number }> {
  try {
    console.log('Admin Panel: Fetching posts with params:', searchParams);

    const query: Query = {
      search: searchParams.search,
      status: searchParams.status !== 'all' ? searchParams.status : undefined,
      author: searchParams.author,
      dateFrom: searchParams.dateFrom,
      dateTo: searchParams.dateTo,
      page: searchParams.page ?? 1,
      limit: searchParams.limit ?? 10,
    };

    const res = await apiFetch<BackendPostListResponse>(
      getApiUrl('admin/posts'),
      {
        method: 'GET',
        query,
      }
    );

    const rowsRaw = (res?.data ?? []) as BackendPost[];
    const total   = res?.total ?? rowsRaw.length;
    const page    = res?.page  ?? (searchParams.page ?? 1);
    const limit   = searchParams.limit ?? 10;
    const pages   = res?.pages ?? Math.max(1, Math.ceil(total / limit));
    const count   = res?.count ?? rowsRaw.length;

    const rows = rowsRaw.map(transformBackendPost);

    console.log('Admin Panel: Posts fetched successfully:', { total, page, pages, count });

    return { rows, total, page, pages, count };
  } catch (error) {
    console.error('Admin Panel: Error fetching posts:', error);
    // Fallback to mock data if backend is not available
    await ensureInitialized();

    const page  = searchParams.page ?? 1;
    const limit = searchParams.limit ?? 10;

    let filteredPosts = Array.from(posts.values());

    // Apply filters
    if (searchParams.search) {
      const search = searchParams.search.toLowerCase();
      filteredPosts = filteredPosts.filter(post =>
        post.title.toLowerCase().includes(search) ||
        post.body?.toLowerCase().includes(search) ||
        post.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    if (searchParams.status && searchParams.status !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.status === searchParams.status);
    }

    if (searchParams.author) {
      const a = searchParams.author.toLowerCase();
      filteredPosts = filteredPosts.filter(post =>
        String(post.author).toLowerCase().includes(a)
      );
    }

    if (searchParams.dateFrom) {
      const fromDate = new Date(searchParams.dateFrom);
      filteredPosts = filteredPosts.filter(post => post.createdAt >= fromDate);
    }

    if (searchParams.dateTo) {
      const toDate = new Date(searchParams.dateTo);
      filteredPosts = filteredPosts.filter(post => post.createdAt <= toDate);
    }

    // Sort by updated date (newest first)
    filteredPosts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // Pagination
    const total = filteredPosts.length;
    const start = (page - 1) * limit;
    const end   = start + limit;
    const rows  = filteredPosts.slice(start, end);
    const pages = Math.max(1, Math.ceil(total / limit));
    const count = rows.length;

    return { rows, total, page, pages, count };
  }
}

export async function getPost(id: string): Promise<Post | null> {
  try {
    console.log('Admin Panel: Fetching post with ID:', id, 'Type:', typeof id);

    const res = await apiFetch<BackendPostResponse>(
      getApiUrl(`admin/posts/${id}`),
      {
        method: 'GET',
      }
    );

    const post = (res?.data ?? res) as BackendPost | undefined;

    if (post) {
      const transformedPost = transformBackendPost(post);
      console.log('Admin Panel: Post transformed:', transformedPost);
      return transformedPost;
    }

    console.log('Admin Panel: Post not found in response');
    return null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      console.log('Admin Panel: Post not found');
      return null;
    }
    console.error('Admin Panel: Error fetching post:', error);
    // Fallback to mock data if backend is not available
    await ensureInitialized();
    return posts.get(id) || null;
  }
}

export async function updatePost(id: string, data: Partial<PostPublish>): Promise<Post | null> {
  try {
    console.log('Admin Panel: Updating post with ID:', id, 'data:', data);

    const res = await apiFetch<BackendUpdatePostResponse, Partial<PostPublish>>(
      getApiUrl(`admin/posts/${id}`),
      {
        method: 'PATCH',
        body: data,
      }
    );

    const updated = (res?.data ?? res) as BackendPost | undefined;

    if (updated) {
      console.log('Admin Panel: About to transform backend post:', updated);
      const transformed = transformBackendPost(updated);
      console.log('Admin Panel: Post transformation successful:', transformed);
      return transformed;
    }

    console.log('Admin Panel: No data in response or success is false');
    return null;
  } catch (error) {
    console.error('Admin Panel: Error updating post:', error);
    console.error('Admin Panel: Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Fallback to mock data if backend is not available
    await ensureInitialized();
    const existing = posts.get(id);
    if (!existing) return null;

    const updated: Post = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    } as Post;

    posts.set(id, updated);
    await savePosts(posts);
    return updated;
  }
}

export async function deletePost(id: string): Promise<boolean> {
  try {
    console.log('Admin Panel: Deleting post with ID:', id);

    const res = await apiFetch<BackendDeletePostResponse>(
      getApiUrl(`admin/posts/${id}`),
      {
        method: 'DELETE',
      }
    );

    return !!(res?.success ?? true);
  } catch (error) {
    console.error('Admin Panel: Error deleting post:', error);
    // Fallback to mock data if backend is not available
    await ensureInitialized();
    const deleted = posts.delete(id);
    if (deleted) {
      await savePosts(posts);
    }
    return deleted;
  }
}

export async function bulkUpdatePosts(action: BulkAction): Promise<{ success: number; failed: number }> {
  await ensureInitialized();
  let success = 0;
  let failed = 0;

  for (const id of action.postIds) {
    try {
      if (action.action === 'delete') {
        if (posts.delete(id)) {
          success++;
        } else {
          failed++;
        }
      } else if (action.action === 'changeStatus' && action.status) {
        const post = posts.get(id);
        if (post) {
          posts.set(id, { ...post, status: action.status, updatedAt: new Date() });
          success++;
        } else {
          failed++;
        }
      }
    } catch {
      failed++;
    }
  }

  // Save changes after bulk operations
  if (success > 0) {
    await savePosts(posts);
  }

  return { success, failed };
}

export async function generatePreviewUrl(id: string): Promise<{ previewUrl: string }> {
  // Mock implementation - in real app, generate signed URL
  const token = Math.random().toString(36).substr(2, 16);
  return { previewUrl: `/preview/post/${id}?token=${token}` };
}

// Media API
export async function getMediaAssets(): Promise<MediaAsset[]> {
  await ensureInitialized();
  return Array.from(mediaAssets.values()).sort((a, b) =>
    b.uploadedAt.getTime() - a.uploadedAt.getTime()
  );
}

export async function uploadMedia(file: File): Promise<{ id: string; url: string }> {
  try {
    console.log('uploadMedia - starting upload for file:', file.name);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}/v1/media/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('uploadMedia - API response:', data);

    if (data.success && data.data) {
      const assetData = data.data;
      const id = assetData._id || assetData.id;
      const url = assetData.url;

      // Create local asset entry for caching
      const asset: MediaAsset = {
        id,
        url,
        mimeType: file.type,
        size: file.size,
        filename: file.name,
        uploadedAt: new Date(),
      };

      console.log('uploadMedia - asset created:', asset);

      // Store in local cache for offline access
      await ensureInitialized();
      mediaAssets.set(id, asset);
      await saveMediaAssets(mediaAssets);

      return { id, url };
    }

    throw new Error('Upload failed: Invalid response format');
  } catch (error) {
    console.error('Error uploading media:', error);
    
    // Fallback to mock implementation if backend is not available
    console.warn('Falling back to mock implementation');
    await ensureInitialized();
    const id = Math.random().toString(36).substr(2, 9);
    const url = `mock://${id}`; // Use a mock URL instead of data URL

    const asset: MediaAsset = {
      id,
      url,
      mimeType: file.type,
      size: file.size,
      filename: file.name,
      uploadedAt: new Date(),
    };

    mediaAssets.set(id, asset);
    await saveMediaAssets(mediaAssets);

    return { id, url };
  }
}

export async function deleteMediaAsset(id: string): Promise<boolean> {
  await ensureInitialized();
  const deleted = mediaAssets.delete(id);
  if (deleted) {
    await saveMediaAssets(mediaAssets);
  }
  return deleted;
}

export async function deleteAllMediaAssets(): Promise<number> {
  await ensureInitialized();
  const count = mediaAssets.size;
  mediaAssets.clear();
  await saveMediaAssets(mediaAssets);
  return count;
}

export async function checkSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
  const existing = Array.from(posts.values()).find(post =>
    post.slug === slug && post.id !== excludeId
  );
  return !existing;
}
