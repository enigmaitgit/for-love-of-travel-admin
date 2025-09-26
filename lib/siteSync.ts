import crypto from 'node:crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { Post } from './api';

const DATA_DIR = path.join(process.cwd(), 'data');
const SYNC_LOG_FILE = path.join(DATA_DIR, 'site-sync-log.json');

const MAX_LOG_ENTRIES = 500;
const MAX_EXCERPT_LENGTH = 200;
const MAX_RESPONSE_SNIPPET = 500;
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [0, 5000, 30000];

export type PostSyncPayload = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  featuredImage?: {
    url: string;
    alt: string | null;
    width: number | null;
    height: number | null;
  } | null;
  tags: string[];
  categories: string[];
  seo: {
    title: string | null;
    description: string | null;
  };
  status: Post['status'];
  scheduledAt: string | null;
  publishedAt: string | null;
  version: number;
};

type SyncStatus = 'PENDING' | 'SENT' | 'CONFIRMED' | 'FAILED';

type SyncLogEntry = {
  id: string;
  entity: 'post';
  entityId: string;
  action: 'sync';
  attempt: number;
  status: SyncStatus;
  httpCode?: number;
  responseSnippet?: string;
  ts: string;
  idempotencyKey: string;
  version: number;
};

export type PostSyncResult = {
  idempotencyKey: string;
  payload: PostSyncPayload;
  responseBody: unknown;
  responseText: string | null;
  httpStatus: number;
};

export class SiteSyncError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, options?: { statusCode?: number; details?: unknown }) {
    super(message);
    this.name = 'SiteSyncError';
    this.statusCode = options?.statusCode ?? 500;
    this.details = options?.details;
  }
}

function assertEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new SiteSyncError(`${name} environment variable is not configured`, {
      statusCode: 500,
    });
  }
  return value;
}

function isAbsoluteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateExcerpt(text: string): string {
  if (text.length <= MAX_EXCERPT_LENGTH) {
    return text;
  }
  const truncated = text.slice(0, MAX_EXCERPT_LENGTH + 1);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 50) {
    return `${truncated.slice(0, lastSpace)}…`;
  }
  return `${text.slice(0, MAX_EXCERPT_LENGTH)}…`;
}

function normaliseFeaturedImage(
  featuredImage: Post['featuredImage']
): PostSyncPayload['featuredImage'] {
  if (!featuredImage) {
    return null;
  }

  if (typeof featuredImage === 'string') {
    if (!isAbsoluteUrl(featuredImage)) {
      throw new SiteSyncError(
        'Featured image URL must be an absolute URL (e.g. https://cdn.example.com/image.jpg)',
        { statusCode: 400 }
      );
    }
    return {
      url: featuredImage,
      alt: null,
      width: null,
      height: null,
    };
  }

  const { url, alt, width, height } = featuredImage as {
    url?: string;
    alt?: string | null;
    width?: number | null;
    height?: number | null;
  };

  if (!url) {
    throw new SiteSyncError('Featured image is missing a URL', { statusCode: 400 });
  }

  if (!isAbsoluteUrl(url)) {
    throw new SiteSyncError(
      'Featured image URL must be an absolute URL (e.g. https://cdn.example.com/image.jpg)',
      { statusCode: 400 }
    );
  }

  return {
    url,
    alt: alt ?? null,
    width: typeof width === 'number' ? width : null,
    height: typeof height === 'number' ? height : null,
  };
}

function buildPostPayload(post: Post): PostSyncPayload {
  if (post.status !== 'published' && post.status !== 'scheduled') {
    throw new SiteSyncError('Only published or scheduled posts can be synced to the main website', {
      statusCode: 400,
    });
  }

  if (!post.title?.trim()) {
    throw new SiteSyncError('Post title is required', { statusCode: 400 });
  }

  if (!post.slug?.trim()) {
    throw new SiteSyncError('Post slug is required', { statusCode: 400 });
  }

  const slug = post.slug.trim();
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugPattern.test(slug)) {
    throw new SiteSyncError(
      'Slug must be kebab-case using lowercase letters, numbers and hyphens only (e.g. paris-on-a-budget)',
      { statusCode: 400 }
    );
  }

  if (!post.body?.trim()) {
    throw new SiteSyncError('Post body must contain HTML before syncing', { statusCode: 400 });
  }

  if (!Array.isArray(post.tags) || post.tags.length === 0) {
    throw new SiteSyncError('At least one tag is required before syncing a post', {
      statusCode: 400,
    });
  }

  const plainTextBody = stripHtml(post.body);
  if (!plainTextBody) {
    throw new SiteSyncError('Unable to generate excerpt because the post body has no text content', {
      statusCode: 400,
    });
  }

  const excerptSource = post.metaDescription?.trim() || plainTextBody;
  const excerpt = truncateExcerpt(excerptSource);

  if (post.status === 'scheduled' && !post.scheduledAt) {
    throw new SiteSyncError('Scheduled posts must include a future scheduledAt date', {
      statusCode: 400,
    });
  }

  const featuredImage = normaliseFeaturedImage(post.featuredImage);

  return {
    id: post.id,
    slug,
    title: post.title.trim(),
    excerpt,
    body: post.body,
    featuredImage,
    tags: post.tags,
    categories: post.categories ?? [],
    seo: {
      title: post.seoTitle?.trim() ?? null,
      description: post.metaDescription?.trim() ?? null,
    },
    status: post.status,
    scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : null,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    version: post.version ?? 1,
  };
}

async function appendSyncLog(entry: Omit<SyncLogEntry, 'ts'>) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let existing: SyncLogEntry[] = [];
  try {
    const raw = await fs.readFile(SYNC_LOG_FILE, 'utf-8');
    if (raw) {
      existing = JSON.parse(raw) as SyncLogEntry[];
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      throw error;
    }
  }

  const record: SyncLogEntry = { ...entry, ts: new Date().toISOString() };
  existing.push(record);
  if (existing.length > MAX_LOG_ENTRIES) {
    existing = existing.slice(existing.length - MAX_LOG_ENTRIES);
  }

  await fs.writeFile(SYNC_LOG_FILE, JSON.stringify(existing, null, 2));
}

function buildSyncUrl(pathSuffix: string): string {
  const base = assertEnv('ADMIN_SITE_SYNC_URL', process.env.ADMIN_SITE_SYNC_URL);
  let sanitizedBase = base.trim();
  if (sanitizedBase.endsWith('/')) {
    sanitizedBase = sanitizedBase.slice(0, -1);
  }
  const sanitizedSuffix = pathSuffix.startsWith('/')
    ? pathSuffix.slice(1)
    : pathSuffix;
  const url = `${sanitizedBase}/${sanitizedSuffix}`;

  if (!isAbsoluteUrl(url)) {
    throw new SiteSyncError('ADMIN_SITE_SYNC_URL must be an absolute http(s) URL', {
      statusCode: 500,
    });
  }

  return url;
}

async function sleep(ms: number) {
  if (ms <= 0) return;
  await new Promise(resolve => setTimeout(resolve, ms));
}

export async function syncPostToSite(post: Post): Promise<PostSyncResult> {
  const payload = buildPostPayload(post);
  const idempotencyKey = crypto.randomUUID();
  const apiKey = assertEnv('ADMIN_SITE_API_KEY', process.env.ADMIN_SITE_API_KEY);
  const url = buildSyncUrl('posts');

  await appendSyncLog({
    id: crypto.randomUUID(),
    entity: 'post',
    entityId: post.id,
    action: 'sync',
    attempt: 0,
    status: 'PENDING',
    idempotencyKey,
    version: post.version ?? 1,
  });

  const body = JSON.stringify(payload);
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await appendSyncLog({
      id: crypto.randomUUID(),
      entity: 'post',
      entityId: post.id,
      action: 'sync',
      attempt,
      status: 'SENT',
      idempotencyKey,
      version: post.version ?? 1,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'x-api-key': apiKey,
        },
        body,
      });

      const text = await response.text();
      const snippet = text ? text.slice(0, MAX_RESPONSE_SNIPPET) : null;

      if (response.ok) {
        let parsed: unknown = null;
        if (text) {
          try {
            parsed = JSON.parse(text);
          } catch {
            parsed = { raw: text };
          }
        }

        await appendSyncLog({
          id: crypto.randomUUID(),
          entity: 'post',
          entityId: post.id,
          action: 'sync',
          attempt,
          status: 'CONFIRMED',
          httpCode: response.status,
          responseSnippet: snippet ?? undefined,
          idempotencyKey,
          version: post.version ?? 1,
        });

        return {
          idempotencyKey,
          payload,
          responseBody: parsed,
          responseText: text || null,
          httpStatus: response.status,
        };
      }

      await appendSyncLog({
        id: crypto.randomUUID(),
        entity: 'post',
        entityId: post.id,
        action: 'sync',
        attempt,
        status: 'FAILED',
        httpCode: response.status,
        responseSnippet: snippet ?? undefined,
        idempotencyKey,
        version: post.version ?? 1,
      });

      lastError = new SiteSyncError(`Site sync failed with status ${response.status}`, {
        statusCode: response.status,
        details: snippet ?? undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await appendSyncLog({
        id: crypto.randomUUID(),
        entity: 'post',
        entityId: post.id,
        action: 'sync',
        attempt,
        status: 'FAILED',
        responseSnippet: message,
        idempotencyKey,
        version: post.version ?? 1,
      });
      lastError = error;
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  if (lastError instanceof SiteSyncError) {
    throw lastError;
  }

  throw new SiteSyncError('Failed to sync post to main site after retries', {
    statusCode: 502,
    details: lastError instanceof Error ? lastError.message : lastError,
  });
}
