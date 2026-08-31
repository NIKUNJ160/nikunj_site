# Original User Request

## Initial Request — 2026-08-30T18:10:23Z

Build a first-party, privacy-conscious Edge Analytics & Event Tracking system for nikunjpateliya.site that logs page views and user interaction events directly to Supabase PostgreSQL, paired with an Admin Analytics Dashboard.

Workspace: d:\nikunj-site

Requirements:
### R1. First-Party Client Tracking Script & API Ingestion
Create a lightweight browser tracker script and Hono API endpoint `/api/analytics/track` to ingest page views (URL path, referrer, session ID, user-agent) and custom interaction events (contact form submits, proposal requests, project clicks, theme toggles) asynchronously into Supabase tables (`page_views`, `event_logs`).

### R2. Database Schema & Admin Analytics Dashboard
Define SQL tables for `page_views` and `event_logs` in `schema.sql`, and build a protected `/admin/analytics` dashboard page in `src/templates.ts` and `src/index.ts` displaying key metrics (total views, unique sessions, top pages, conversion events, and recent activity logs) in a dual-theme glassmorphism layout.

Acceptance Criteria:
- POST `/api/analytics/track` accepts JSON event payloads and records page views and custom events accurately.
- Browser tracking script automatically logs initial page load and elements marked with `data-track-event`.
- `/admin/analytics` is protected by `adminAuthMiddleware` and displays total views, top referral sources, and conversion event summaries.
- Runs cleanly with `npm run typecheck` passing with zero errors.
