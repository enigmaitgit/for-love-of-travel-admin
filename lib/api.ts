import { PostDraft, PostPublish, PostSearch, BulkAction } from './validation';
import { loadPosts, savePosts, loadMediaAssets, saveMediaAssets } from './persistence';

export type Post = PostDraft & {
  id: string;
  author: string;
  status: 'draft' | 'review' | 'scheduled' | 'published';
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  publishedAt?: Date;
  version: number;
};

export type MediaAsset = {
  id: string;
  url: string;
  type: 'image' | 'video';
  sizeKB: number;
  filename: string;
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
    version: 1,
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
    version: 1,
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
    version: 1,
  },
];

const mockMedia: MediaAsset[] = [
  // No preloaded media - start with empty library
];

// Initialize mock data after loading from persistence
async function initializeMockData() {
  const loadedPosts = await loadPosts();
  const loadedMedia = await loadMediaAssets();
  
  // Load existing data
  posts = loadedPosts;
  mediaAssets = loadedMedia;
  
  // Only add mock data if no data exists
  if (loadedPosts.size === 0) {
    mockPosts.forEach(post => posts.set(post.id, post));
    await savePosts(posts);
  }
  
  if (loadedMedia.size === 0) {
    mockMedia.forEach(asset => mediaAssets.set(asset.id, asset));
    await saveMediaAssets(mediaAssets);
  }
}

// Track initialization state
let isInitialized = false;
const initPromise = initializeMockData().then(() => {
  isInitialized = true;
}).catch(console.error);

// Wait for initialization to complete
async function ensureInitialized() {
  if (!isInitialized) {
    await initPromise;
  }
}

// Posts API
export async function createPost(data: PostDraft): Promise<{ id: string }> {
  await ensureInitialized();
  const id = Math.random().toString(36).substr(2, 9);
  const post: Post = {
    ...data,
    id,
    author: 'Current User', // In real app, get from auth
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };
  
  posts.set(id, post);
  await savePosts(posts);
  return { id };
}

export async function getPosts(searchParams: PostSearch): Promise<{ rows: Post[]; total: number }> {
  await ensureInitialized();
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
  
  if (searchParams.status !== 'all') {
    filteredPosts = filteredPosts.filter(post => post.status === searchParams.status);
  }
  
  if (searchParams.author) {
    filteredPosts = filteredPosts.filter(post =>
      post.author.toLowerCase().includes(searchParams.author!.toLowerCase())
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
  const start = (searchParams.page - 1) * searchParams.limit;
  const end = start + searchParams.limit;
  const rows = filteredPosts.slice(start, end);
  
  return { rows, total };
}

export async function getPost(id: string): Promise<Post | null> {
  await ensureInitialized();
  return posts.get(id) || null;
}

export async function updatePost(id: string, data: Partial<PostPublish>): Promise<Post | null> {
  await ensureInitialized();
  const existing = posts.get(id);
  if (!existing) return null;

  console.log('updatePost - data received:', data);
  console.log('updatePost - featuredImage:', data.featuredImage);

  const nextStatus = (data.status ?? existing.status) as Post['status'];
  const now = new Date();

  let nextPublishedAt = existing.publishedAt;
  if (nextStatus === 'published') {
    nextPublishedAt = data.publishedAt ?? existing.publishedAt ?? now;
  }

  let nextScheduledAt = data.scheduledAt ?? existing.scheduledAt;
  if (nextStatus !== 'scheduled') {
    nextScheduledAt = undefined;
  }

  const updated: Post = {
    ...existing,
    ...data,
    status: nextStatus,
    updatedAt: now,
    publishedAt: nextPublishedAt,
    scheduledAt: nextScheduledAt,
    version: existing.version + 1,
  };
  
  console.log('updatePost - updated post:', updated);
  console.log('updatePost - updated featuredImage:', updated.featuredImage);
  
  posts.set(id, updated);
  await savePosts(posts);
  return updated;
}

export async function deletePost(id: string): Promise<boolean> {
  await ensureInitialized();
  const deleted = posts.delete(id);
  if (deleted) {
    await savePosts(posts);
  }
  return deleted;
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
          const now = new Date();
          const nextStatus = action.status as Post['status'];
          let nextPublishedAt = post.publishedAt;
          if (nextStatus === 'published') {
            nextPublishedAt = post.publishedAt ?? now;
          }
          let nextScheduledAt = post.scheduledAt;
          if (nextStatus !== 'scheduled') {
            nextScheduledAt = undefined;
          }

          posts.set(id, {
            ...post,
            status: nextStatus,
            updatedAt: now,
            publishedAt: nextPublishedAt,
            scheduledAt: nextScheduledAt,
            version: post.version + 1,
          });
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
  await ensureInitialized();
  console.log('uploadMedia - starting upload for file:', file.name);
  
  // Mock implementation - in real app, upload to storage service
  const id = Math.random().toString(36).substr(2, 9);
  
  // Create a data URL for immediate preview using Node.js compatible method
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const url = `data:${file.type};base64,${base64}`;
  
  console.log('uploadMedia - data URL created, length:', url.length);
  console.log('uploadMedia - data URL preview:', url.substring(0, 100) + '...');
  
  const asset: MediaAsset = {
    id,
    url,
    type: file.type.startsWith('video/') ? 'video' : 'image',
    sizeKB: Math.round(file.size / 1024),
    filename: file.name,
    uploadedAt: new Date(),
  };
  
  console.log('uploadMedia - asset created:', asset);
  
  mediaAssets.set(id, asset);
  console.log('uploadMedia - asset added to map, total assets:', mediaAssets.size);
  
  await saveMediaAssets(mediaAssets);
  console.log('uploadMedia - assets saved to file');
  
  return { id, url };
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
