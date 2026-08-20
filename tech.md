# Tech Stack — nikunj-portfolio

> Architecture, tooling, and infrastructure reference.
> Last updated: August 2026

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Cloudflare Edge                    │
│                                                       │
│  ┌──────────────┐   ┌──────────────┐                  │
│  │  Workers KV   │   │  Hono Router │   Supabase DB    │
│  │  (rate limit  │◄──│  (index.ts)  │──► (PostgreSQL) │
│  │   planned)    │   │              │                  │
│  └──────────────┘   └──────┬───────┘                  │
│                             │                         │
│                      ┌──────┴───────┐                │
│                      │ Static Assets│                │
│                      │   (public/)  │                │
│                      └──────────────┘                │
└─────────────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
    HTTPS Request       GitHub Actions
    (visitor)           (auto deploy)
```

**Runtime:** Cloudflare Workers (V8 isolates — no Node.js, no container)
**Rendering:** Server-rendered HTML templates (no React/Vue/Svelte) + client-side hydration via vanilla JS `fetch('/api/portfolio-data')`
**Database:** Supabase (PostgreSQL via `@supabase/supabase-js`)

---

## 2. Dependency Map

### Production Dependencies

| Package | Version | Purpose |
|---|---|---|
| `hono` | `^4.13.1` | Lightweight edge-first web framework — routing, middleware, context |
| `@supabase/supabase-js` | `^2.x.x` | Supabase JS client for database interactions |

> **Total production dependencies: 2.** Minimal footprint.

### Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@cloudflare/workers-types` | `^5.20260810.1` | TypeScript type definitions for Workers runtime APIs |
| `typescript` | `^5.9.3` | TypeScript compiler for type checking |
| `wrangler` | `^4.120.0` | Cloudflare CLI — local dev, deployment |

---

## 3. Source Code Structure

```
src/
├── index.ts       # Hono app — routes, middleware, CRUD handlers (520 lines)
├── auth.ts        # Auth module — PBKDF2 hashing, JWT sessions, CSRF, cookies (193 lines)
├── env.ts         # TypeScript interfaces — Env bindings, DB row types (79 lines)
└── templates.ts   # Server-side HTML templates — all pages rendered here (982 lines)

public/
├── assets/
│   ├── css/style.css    # Full design system (907 lines)
│   ├── js/main.js       # Client hydration, liquid bg, scroll animations (261 lines)
│   └── images/
│       ├── logo.jpg     # Nav logo (192 KB — oversized)
│       └── projects/    # User-uploaded project thumbnails
├── github.svg           # Social icon
├── instagram.svg        # Social icon
└── linkedin.svg         # Social icon

schema.sql               # Supabase PostgreSQL schema (6 tables)
wrangler.toml             # Cloudflare deployment config (prod + staging)
tsconfig.json             # TypeScript strict config
```

## 4. Database Schema (Supabase / PostgreSQL)

### Tables

| Table | Purpose | Core Schema Details |
| --- | --- | --- |
| `users` | Store user and admin accounts | Supports role authorization (`'admin'`, `'user'`) |
| `blog_posts` | Manage blog posts with SEO tracking | Unique slugs and publication dates for sitemap ingestion |
| `messages` | Log contact messages | Message logs from users / visitors |
| `site_metadata` | Key-value store for static SEO values | Dynamic configuration of site descriptions and title overrides |

### SQL Schema Definitions

```sql
-- User and Admin authentication table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
);

-- Blog posts table containing slug and publication status for Sitemap
CREATE TABLE blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    is_published INTEGER DEFAULT 0 CHECK(is_published IN (0, 1)),
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
);

-- Contact messages
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'read', 'replied')),
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Key-value settings metadata
CREATE TABLE site_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

### Supabase Projects

| Environment | Purpose |
| --- | --- |
| Production | Primary PostgreSQL instance on Supabase |

## 5. Authentication & Security

### Password Hashing
- **Algorithm:** PBKDF2 (Web Crypto API)
- **Iterations:** 100,000
- **Hash:** SHA-256
- **Salt:** 16 bytes random per password
- **Storage format:** `<salt_hex>:<hash_hex>`

### Session Management
- **Format:** Custom JWT (HS256 HMAC)
- **Lifetime:** 2 hours (was 7 days — hardened)
- **Cookie flags:** `HttpOnly; SameSite=Strict; Secure`
- **Verification:** Constant-time comparison (`timingSafeEqual`)

### CSRF Protection
- **Method:** Time-windowed HMAC tokens (1-hour windows)
- **Accepts:** Current and previous window (handles boundary edge cases)
- **Derived from:** `JWT_SECRET_KEY` — no server state needed

### Rate Limiting
- **Implementation:** In-memory `Map` per isolate (not persistent across cold starts)
- **Contact form:** 5 requests / IP / hour
- **Login:** 10 attempts / IP / 15 minutes
- **Registration:** 3 attempts / IP / hour

### Security Headers (all responses)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
```

### Environment Secrets
| Secret | Set via | Notes |
|---|---|---|
| `JWT_SECRET_KEY` | `wrangler secret put` | Must be set — app returns 500 if missing |
| `INVITE_CODE` | `wrangler secret put` | Required for registration |
| `SUPABASE_URL` | `wrangler.toml` [vars] | Required for Supabase |
| `SUPABASE_ANON_KEY` | `wrangler.toml` [vars] | Required for Supabase |
| `ALLOW_REGISTRATION` | `wrangler.toml` [vars] | `"false"` in prod, `"true"` in staging |

---

## 6. API Endpoints

### 6.1 Public / General Routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Portfolio homepage |
| `GET` | `/api/portfolio-data` | Public projects and content metadata JSON |
| `GET` | `/sitemap.xml` | Dynamic XML sitemap generation for search engines |

### 6.2 User Authentication (User Sign-In / Registration)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/user/login` | User login page |
| `POST` | `/user/login` | Authenticate user session |
| `GET` | `/user/register` | User signup page |
| `POST` | `/user/register` | Register new user account |
| `POST` | `/user/logout` | Terminate user session & clear cookies |

### 6.3 Admin Authentication (Admin Sign-In)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/admin/login` | Dedicated admin login page |
| `POST` | `/admin/login` | Authenticate admin session (timing-safe check) |
| `POST` | `/admin/logout` | Terminate admin session & clear cookies |

### 6.4 Admin Panel (Protected by `adminAuthMiddleware`)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/admin/menu` | Admin dashboard main menu / portal navigation |
| `GET` | `/admin/menu/users` | List and manage registered system users |
| `POST` | `/admin/menu/users/delete` | Remove a user account |
| `GET` | `/admin/menu/content` | Content management panel |
| `POST` | `/admin/menu/content/save` | Create/update portfolio or blog entries |
| `GET` | `/admin/menu/settings` | Portal system settings configuration |

---

## 7. CI/CD Pipeline

### Production Deploy ([`deploy.yml`](file:///d:/portfolio/.github/workflows/deploy.yml))

```
push to main
    ↓
┌──────────────────────┐
│   quality (Job 1)    │  npm ci → tsc --noEmit → npm audit --audit-level=high
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│   migrate (Job 2)    │  (Manual or automated migrations via Supabase CLI)
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│   deploy (Job 3)     │  wrangler deploy → deployment summary
└──────────────────────┘
```

- **Trigger:** Push to `main` only
- **Concurrency:** `group: production-deploy, cancel-in-progress: true`
- **Timeouts:** 10 min (quality, deploy), 5 min (migrate)

### Rollback ([`rollback.yml`](file:///d:/portfolio/.github/workflows/rollback.yml))
- **Trigger:** Manual `workflow_dispatch`
- **Inputs:** Required reason + optional deployment ID
- **Command:** `wrangler rollback`

---

## 8. NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `wrangler dev` | Local development server |
| `build` | `npm run typecheck` | Type-check only (no emit) |
| `deploy` | `wrangler deploy` | Manual deploy to production |
| `db:init` | `n/a` | (Manage via Supabase UI / CLI) |
| `db:deploy` | `n/a` | (Manage via Supabase UI / CLI) |
| `typecheck` | `tsc --noEmit` | TypeScript strict check |

---

## 9. TypeScript Configuration

| Setting | Value | Rationale |
|---|---|---|
| `target` | `ESNext` | Workers V8 supports latest JS |
| `module` | `ESNext` | ESM required by Workers |
| `moduleResolution` | `bundler` | Wrangler bundles with esbuild |
| `strict` | `true` | Full strict mode enabled |
| `noEmit` | `true` | Type-check only — Wrangler does the build |
| `types` | `@cloudflare/workers-types` | Workers runtime API types |
| `jsx` | `react-jsx` | Defined but unused currently |

---

## 10. Known Technical Debt

1. **Rate limiter is in-memory** — resets on cold start; should migrate to Workers KV
2. **Templates are a 982-line monolith** — needs component extraction
3. **No test suite** — zero unit or integration tests
4. **No linter** (ESLint/Biome) in pipeline
5. **Schema migrations are additive only** — `CREATE TABLE IF NOT EXISTS` can't handle ALTER TABLE
6. **Logo image is 192 KB** for a 36px render — needs resize + WebP
7. **No cache-busting** on `style.css` and `main.js` — stale after deploys
8. **`jsx: react-jsx`** in tsconfig but no JSX is used anywhere

---

## 11. Dynamic Sitemap Generation

To maximize SEO discoverability, the site serves a dynamic `/sitemap.xml` generated directly at the Cloudflare Edge. This avoids maintaining a static file and guarantees that newly published blog posts or content revisions are instantly visible to search engine indexers.

### Implementation Strategy

- **Format:** Serves standard `application/xml` headers.
- **Caching:** Responses are cached at the edge using the Cloudflare Cache API with a TTL of 1 hour (`Cache-Control: public, max-age=3600`) to prevent unnecessary database reads on crawler sweeps. Cache is purged programmatically upon content publication or updates.
- **Generation Logic:**

  1. Fetch all static routes (e.g. `/` as priority `1.0`, `/user/login` as priority `0.3`).
  2. Query Supabase database for all published blog posts:

     ```sql
     SELECT slug, updated_at FROM blog_posts WHERE is_published = 1;
     ```

  3. Format database records into `<url>` entries using the standard XML namespace:

     ```xml
     <?xml version="1.0" encoding="UTF-8"?>
     <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
       <!-- Static Route -->
       <url>
         <loc>https://nikunjpateliya.site/</loc>
         <changefreq>weekly</changefreq>
         <priority>1.0</priority>
       </url>
       <!-- Dynamic Blog Post Route -->
       <url>
         <loc>https://nikunjpateliya.site/blog/example-slug</loc>
         <lastmod>2026-08-13T07:17:00Z</lastmod>
         <changefreq>monthly</changefreq>
         <priority>0.8</priority>
       </url>
     </urlset>
     ```
