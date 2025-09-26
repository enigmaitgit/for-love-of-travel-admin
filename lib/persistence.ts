import { Post, MediaAsset } from './api';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const MEDIA_FILE = path.join(DATA_DIR, 'media.json');

// tiny JSON helper with generics
async function readJsonFile<T>(file: string): Promise<T | null> {
  try {
    const data = await fs.readFile(file, 'utf-8');
    if (!data || data.trim() === '' || data.trim() === '[]') return null;
    return JSON.parse(data) as T;
  } catch {
    // file missing or unreadable
    return null;
  }
}

async function writeJsonFile<T>(file: string, value: T): Promise<void> {
  await fs.writeFile(file, JSON.stringify(value, null, 2));
}

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error: unknown) {
    console.error('Error creating data directory:', error);
  }
}

// Load posts from file
export async function loadPosts(): Promise<Map<string, Post>> {
  try {
    await ensureDataDir();

    const postsArray = await readJsonFile<Array<Record<string, unknown>>>(POSTS_FILE);
    if (!postsArray) return new Map();

    const postsMap = new Map<string, Post>();
    for (const post of postsArray) {
      postsMap.set(post.id as string, {
        ...(post as unknown as Post),
        createdAt: new Date(post.createdAt as string),
        updatedAt: new Date(post.updatedAt as string),
        scheduledAt: post.scheduledAt ? new Date(post.scheduledAt as string) : undefined,
        publishedAt: post.publishedAt ? new Date(post.publishedAt as string) : undefined,
        version: typeof post.version === 'number' ? (post.version as number) : 1,
      });
    }
    return postsMap;
  } catch (error: unknown) {
    console.error('Error loading posts:', error);
    return new Map();
  }
}

// Save posts to file
export async function savePosts(posts: Map<string, Post>): Promise<void> {
  try {
    await ensureDataDir();
    const postsArray = Array.from(posts.values());
    await writeJsonFile(POSTS_FILE, postsArray);
  } catch (error: unknown) {
    console.error('Error saving posts:', error);
  }
}

// Load media assets from file
export async function loadMediaAssets(): Promise<Map<string, MediaAsset>> {
  try {
    await ensureDataDir();

    const mediaArray = await readJsonFile<Array<Record<string, unknown>>>(MEDIA_FILE);
    if (!mediaArray) return new Map();

    const mediaMap = new Map<string, MediaAsset>();
    for (const asset of mediaArray) {
      mediaMap.set(asset.id as string, {
        ...(asset as unknown as MediaAsset),
        uploadedAt: new Date(asset.uploadedAt as string),
      });
    }
    return mediaMap;
  } catch (error: unknown) {
    console.error('Error loading media assets:', error);
    return new Map();
  }
}

// Save media assets to file
export async function saveMediaAssets(media: Map<string, MediaAsset>): Promise<void> {
  try {
    await ensureDataDir();
    const mediaArray = Array.from(media.values());
    await writeJsonFile(MEDIA_FILE, mediaArray);
  } catch (error: unknown) {
    console.error('Error saving media assets:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      // Narrow to a NodeJS error only if it is one:
      code: (error as NodeJS.ErrnoException)?.code,
    });
    throw error; // keep behavior
  }
}
