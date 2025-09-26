# Site Sync Requirements Assessment

## Current Implementation Snapshot
- Admin post data is persisted locally in JSON files that are loaded into in-memory maps on startup (`loadPosts`/`savePosts` and companions). This keeps the CMS self-contained but means publishing relies on the admin runtime rather than a durable queue or database.【F:lib/persistence.ts†L1-L109】【F:lib/api.ts†L24-L155】
- The post sync helper enforces payload shape, excerpt generation, slug rules, featured-image normalization, scheduled publish validation, and produces an audit log entry for every attempt before issuing an HTTP request to the main site.【F:lib/siteSync.ts†L6-L231】
- Actual uploads from the Posts screen invoke the sync helper via a dedicated API route. Successes and failures surface only as toast notifications to the editor; there is no persisted retry UI yet.【F:app/api/admin/posts/[id]/upload-to-main/route.ts†L1-L68】【F:app/(layouts)/layout-1/blog/posts/page.tsx†L177-L290】

## Coverage vs. Main-Site Contract
| Requirement | Status | Notes |
| --- | --- | --- |
| **POST /api/sync/posts** endpoint invoked with JSON body & idempotency key | ✅ | `syncPostToSite` posts to `{ADMIN_SITE_SYNC_URL}/posts` with `Idempotency-Key` and `x-api-key` headers, retrying up to three times on failure.【F:lib/siteSync.ts†L258-L407】 |
| **POST /api/sync/content-page** endpoint | ❌ | No equivalent helper or route exists yet; `lib/siteSync.ts` only defines post-specific payloads/logging. |
| **Payload mapping (id, slug, title, excerpt, body HTML, media metadata, tags, categories, SEO, status timestamps, version)** | ✅ | The builder assembles all required fields, generating excerpts and normalizing images before upload.【F:lib/siteSync.ts†L114-L231】 |
| **Mandatory validations (slug kebab-case, body HTML, ≥1 tag, scheduledAt future)** | ✅ | Explicit guards throw `SiteSyncError` when rules are violated so the API route can return 4xx feedback to the UI.【F:lib/siteSync.ts†L162-L210】 |
| **Editor output converted to HTML** | ⚠️ | Posts store whatever HTML authors type into the rich-text editor; there is no explicit Markdown-to-HTML transform or sanitization step. Confirmation needed on the editor’s final format.【F:app/(layouts)/layout-1/blog/posts/[id]/edit/page.tsx†L1-L120】 |
| **Auto excerpt (160–200 chars)** | ✅ | `truncateExcerpt` trims the meta description or stripped body to ≤200 chars with ellipsis handling.【F:lib/siteSync.ts†L102-L205】 |
| **Unique slug enforcement (409 on conflict)** | ❌ | API routes accept any slug; neither `createPost` nor `updatePost` checks for duplicates across stored posts.【F:lib/api.ts†L138-L244】 |
| **Image normalization to CDN URLs** | ⚠️ | Sync validation rejects relative URLs, but the media library still stores uploads as base64 data URIs, so editors cannot meet the CDN-only requirement without external tooling.【F:lib/siteSync.ts†L114-L160】【F:lib/api.ts†L323-L355】 |
| **Asset size/format validation at upload** | ❌ | No limits besides 25 MB on the mock uploader; dimensions, MIME, and CDN validation occur only during sync.【F:lib/api.ts†L323-L355】 |
| **Outbox table & retry state machine** | ⚠️ | Each attempt is appended to `data/site-sync-log.json`, but there is no surfaced job queue or manual retry interface in the admin UI.【F:lib/siteSync.ts†L234-L406】 |
| **Editor notifications / manual retry** | ⚠️ | Toasts show immediate success/failure, yet failures require users to re-trigger uploads manually; there is no list of failed jobs to retry later.【F:app/(layouts)/layout-1/blog/posts/page.tsx†L177-L290】 |
| **Environment configuration & cross-env guardrails** | ⚠️ | Sync requires `ADMIN_SITE_SYNC_URL` and `ADMIN_SITE_API_KEY` and trims trailing slashes, but there is no logic preventing staging from targeting production URLs or rotating secrets automatically.【F:lib/siteSync.ts†L75-L287】 |
| **Scheduling support with scheduledAt propagation** | ✅ | Scheduled posts must include a future `scheduledAt`, which is forwarded in ISO format along with `publishedAt` and the version counter maintained by the model.【F:lib/siteSync.ts†L162-L231】【F:lib/api.ts†L216-L244】 |
| **Trigger ISR/revalidation hooks** | ❌ | Admin never hits a dedicated revalidation endpoint; only the post payload is sent. |
| **Audit UI** | ❌ | Although logs are written to disk, nothing in the UI renders a history of sync attempts or statuses. |

## Follow-Up Information Needed
1. **Live Site Contracts** – Confirm the exact URLs for `POST /api/sync/posts` and the future content-page endpoint, plus whether additional headers or payload fields are expected beyond the documented contract.
2. **Authentication Choice** – Will the site rely on the `x-api-key` header already wired up, or should we pivot to JWTs or another mechanism? Please share key rotation cadence and storage expectations.
3. **Content Page Structure** – Provide the final JSON schema (sections, props) that the main site accepts so we can build validation and sync tooling similar to posts.
4. **Slug & Conflict Resolution** – Should the admin auto-adjust conflicting slugs, surface a blocking error from the site, or both? Clarifying this lets us add duplicate detection before sync.
5. **Media Pipeline** – Are editors expected to upload directly to S3/Cloudinary from the admin, or will the main site download assets from provided URLs? Guidance determines how we replace the base64 placeholder uploader.
6. **Outbox & Monitoring** – Outline requirements for the sync audit UI (filters, retry actions, Slack/email alerts) so we can design the persistence layer and components accordingly.
7. **Revalidation Strategy** – Should the admin call a separate revalidation endpoint after successful syncs, or will the site handle ISR internally based on the post payload?

With answers to the above, we can close the remaining gaps and ensure the admin reliably publishes content to the production site.
