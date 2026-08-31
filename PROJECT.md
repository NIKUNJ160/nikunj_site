# Project: Edge Analytics & Event Tracking System

## Architecture
- **Runtime Environment:** Cloudflare Workers / Vercel Serverless Function via Hono v4.13.1.
- **Database:** Supabase PostgreSQL with schema definitions in `schema.sql`.
- **Client Tier:** Lightweight browser tracker (`public/assets/js/tracker.js`) with declarative DOM listeners (`data-track-event`) and beacon/keepalive fetch dispatching.
- **API Ingestion:** `POST /api/analytics/track` in `src/index.ts` processing pageviews and custom events asynchronously.
- **Admin Dashboard:** `GET /admin/analytics` in `src/index.ts` protected by `adminAuthMiddleware`, rendered via `adminAnalyticsPage()` in `src/templates.ts` with dual-theme glassmorphic UI.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | DB Schema & Indexes | SQL tables `page_views` and `event_logs` with composite/timestamp indexes | M1 | Survey Explorer 1 |
| 2 | Analytics Ingestion API | `POST /api/analytics/track` accepting JSON/beacon payloads, enriching metadata & inserting to DB | M1 | Survey Explorer 1 |
| 3 | Browser Tracking Script | `public/assets/js/tracker.js` with session management, pageview tracking, declarative event delegation | M2 | Survey Explorer 2 |
| 4 | Template Instrumentation | Inject script in `layout()`, add `data-track-event` across contact, proposal, theme toggle, CV, and projects | M2 | Survey Explorer 2 |
| 5 | Admin Analytics Route | `GET /admin/analytics` in `src/index.ts` protected by `adminAuthMiddleware` with DB aggregation queries | M3 | Survey Explorer 3 |
| 6 | Admin Analytics Template | `adminAnalyticsPage()` in `src/templates.ts` with dual-theme glassmorphism KPI cards and activity tables | M3 | Survey Explorer 3 |
| 7 | Full E2E & Typecheck Pass | Opaque-box E2E test suite (Tiers 1-4) & clean `npm run typecheck` (0 errors) | M4 | Survey Explorers 1-3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Database Schema & Ingestion API | `schema.sql`, `src/types.ts`, `src/index.ts` (`POST /api/analytics/track`) | None | DONE |
| 2 | M2: Browser Tracker & Template Instrumentation | `public/assets/js/tracker.js`, `src/templates.ts` (event attributes & script tag) | M1 | DONE |
| 3 | M3: Admin Analytics Route & UI Template | `src/index.ts` (`GET /admin/analytics`), `src/templates.ts` (`adminAnalyticsPage`), admin navigation | M1, M2 | IN_PROGRESS |
| 4 | M4: Final Milestone (E2E Verification & Typecheck) | Pass 100% E2E test suite & `npm run typecheck` | M1, M2, M3, E2E Test Suite | PLANNED |

## Interface Contracts

### Client ↔ Ingestion API (`POST /api/analytics/track`)
- **Request Body (JSON or text/plain from beacon):**
  ```json
  {
    "type": "pageview" | "event",
    "session_id": "string (UUID)",
    "url_path": "string",
    "referrer": "string (optional)",
    "user_agent": "string (optional, client-side fallback)",
    "event_name": "string (optional for type=event)",
    "event_category": "string (optional for type=event)",
    "event_data": { "key": "value" }
  }
  ```
- **Response:**
  - Success: Status `200 OK`, `{ "success": true }`
  - Validation Error: Status `400 Bad Request`, `{ "error": "Invalid payload" }`

### Supabase Database Schema
- **Table `page_views`**: `id (BIGSERIAL PK)`, `session_id (TEXT)`, `url_path (TEXT)`, `referrer (TEXT)`, `user_agent (TEXT)`, `ip_address (TEXT)`, `device_type (TEXT)`, `country (TEXT)`, `created_at (TIMESTAMPTZ DEFAULT now())`.
- **Table `event_logs`**: `id (BIGSERIAL PK)`, `session_id (TEXT)`, `event_name (TEXT)`, `event_category (TEXT)`, `url_path (TEXT)`, `event_data (JSONB)`, `created_at (TIMESTAMPTZ DEFAULT now())`.

### Admin Dashboard Contract (`GET /admin/analytics`)
- **Guard:** `adminAuthMiddleware` (checks `admin_session` JWT cookie; redirects to `/admin/login` on failure).
- **Template:** `adminAnalyticsPage(stats: AnalyticsStats, role: 'admin')`.

## Code Layout
- `schema.sql`: Database schema definition for PostgreSQL / Supabase.
- `src/types.ts`: TypeScript interface definitions (`PageViewRecord`, `EventLogRecord`, `AnalyticsTrackPayload`, `AnalyticsStats`).
- `src/index.ts`: Hono routes (`POST /api/analytics/track`, `GET /admin/analytics`), middleware bindings, and error handlers.
- `src/templates.ts`: SSR HTML template functions (`layout`, `adminAnalyticsPage`, instrumented component templates).
- `public/assets/js/tracker.js`: Lightweight browser tracking script.
- `tests/`: E2E and unit test suites.
