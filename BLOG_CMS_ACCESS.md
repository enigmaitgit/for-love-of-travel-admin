# Blog CMS Access Guide

## 🚀 How to Access the Blog CMS

The blog CMS has been successfully integrated into your **metronic-react-starter-kit** project. Here's how to access it:

### 1. Start the Development Server

```bash
# Navigate to your project directory
cd "F:\Enigma IT\Project - Love of Travel\Admin Panel\metronic-v9.2.7\metronic-react-starter-kit\typescript\nextjs"

# Install dependencies (if not already done)
pnpm install

# Start the development server
pnpm dev
```

### 2. Access the Blog CMS

Open your browser and navigate to:

**Main Dashboard:**
- `http://localhost:3000/(layouts)/layout-1/blog/dashboard`

**Posts Management:**
- `http://localhost:3000/(layouts)/layout-1/blog/posts`

**Create New Post:**
- `http://localhost:3000/(layouts)/layout-1/blog/posts/new`

### 3. Navigation Flow

1. **Start at Dashboard** - You'll see the blog dashboard with quick navigation cards
2. **Click "Posts"** - Go to the posts management page with filters and table
3. **Click "New Post"** - Create a new blog post with the form
4. **Use Filters** - Search, filter by status, author, date range
5. **Bulk Actions** - Select multiple posts for bulk operations

## 📁 Files Created

### Core Files
- `lib/rbac.ts` - Role-based access control
- `lib/slug.ts` - Slug generation utilities
- `lib/validation.ts` - Zod validation schemas
- `lib/api.ts` - Mock API functions

### Pages
- `app/(layouts)/layout-1/blog/posts/page.tsx` - Posts list with filters
- `app/(layouts)/layout-1/blog/posts/new/page.tsx` - Create new post form

### API Routes
- `app/api/admin/posts/route.ts` - POST create, GET list
- `app/api/admin/posts/[id]/route.ts` - GET detail, PATCH update, DELETE

### Updated Files
- `app/(layouts)/layout-1/blog/dashboard/page.tsx` - Added navigation cards

## 🎯 Features Available

### ✅ Posts Management
- **List View** - Table with search, filters, pagination
- **Create Post** - Form with title, slug, content, SEO fields
- **Status Management** - Draft, Review, Scheduled, Published
- **Bulk Actions** - Change status, delete multiple posts
- **Real-time Search** - Filter by title, content, tags

### ✅ Form Features
- **Auto-slug Generation** - Creates URL-friendly slugs from titles
- **Validation** - Client and server-side validation with error messages
- **Tags & Categories** - Add/remove tags and categories
- **SEO Fields** - Title, meta description, JSON-LD toggle
- **Role-based Access** - Different permissions for different user roles

### ✅ UI/UX
- **Metronic Design** - Consistent with your existing design system
- **Responsive** - Works on all screen sizes
- **Accessible** - Keyboard navigation and ARIA labels
- **Loading States** - Proper loading indicators
- **Error Handling** - User-friendly error messages

## 🔌 Publishing to the Main Website

The "Upload to Main Website" bulk action and row action now forward posts to your production site instead of returning mock data.

### Required Environment Variables

Add the following secrets to your admin panel runtime (e.g. `.env.local`):

```bash
ADMIN_SITE_SYNC_URL="https://<your-site-domain>/api/sync"
ADMIN_SITE_API_KEY="<shared-secret>"
```

- `ADMIN_SITE_SYNC_URL` should point to the base path that exposes the `POST /posts` sync endpoint described in the integration brief (e.g. `https://www.example.com/api/sync`).
- `ADMIN_SITE_API_KEY` is sent as an `x-api-key` header on every sync request. Rotate it per environment.

### Payload Contract

When a post is marked `published` or `scheduled`, the admin sends the following payload to `POST {ADMIN_SITE_SYNC_URL}/posts`:

```jsonc
{
  "id": "post_123",
  "slug": "paris-on-a-budget",
  "title": "Paris on a Budget",
  "excerpt": "A quick guide…",
  "body": "<h2>Intro</h2><p>…</p>",
  "featuredImage": {
    "url": "https://cdn.example.com/img/paris.webp",
    "alt": "Eiffel Tower at dusk",
    "width": 1600,
    "height": 900
  },
  "tags": ["europe", "budget"],
  "categories": ["city-guides"],
  "seo": {
    "title": "Paris on a Budget – Love of Travel",
    "description": "How to do Paris cheaply."
  },
  "status": "published",
  "scheduledAt": null,
  "publishedAt": "2025-06-25T09:20:00Z",
  "version": 3
}
```

Validation enforced before syncing:

- Slug must already be kebab-case (`[a-z0-9-]`).
- Posts need HTML body content and at least one tag.
- Scheduled posts must include a future `scheduledAt` date.
- Featured images must use absolute CDN URLs (data URLs are rejected).

### Delivery Guarantees

- Each sync call includes a generated `Idempotency-Key` header.
- The admin retries failed attempts with exponential backoff (`0s`, `5s`, `30s`).
- Responses (success or failure) are logged to `data/site-sync-log.json` with `{entity, version, status, httpCode, idempotencyKey}` for auditing.

### UI Feedback

- Success toasts confirm when the live site acknowledges the post.
- Error toasts include the API error message and optional details returned from the site so editors can quickly resolve validation issues.

## 🔧 Mock Data

The system includes sample data:
- 3 sample blog posts with different statuses
- Mock media assets
- Role-based permissions (currently set to 'editor' role)

## 🚧 Next Steps

1. **Test the functionality** - Create, edit, and manage posts
2. **Customize styling** - Adjust colors, spacing to match your brand
3. **Add real authentication** - Replace mock RBAC with real auth
4. **Integrate database** - Replace mock storage with real database
5. **Add rich text editor** - Replace textarea with Tiptap editor
6. **Implement file uploads** - Add real media library functionality

## 🎉 Ready to Use!

The blog CMS is fully functional and ready for development. You can start creating and managing blog posts immediately!

**Quick Start:**
1. Run `pnpm dev`
2. Go to `http://localhost:3000/(layouts)/layout-1/blog/dashboard`
3. Click "Posts" to manage your blog posts
4. Click "New Post" to create your first post




