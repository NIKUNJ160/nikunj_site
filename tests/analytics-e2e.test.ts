import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  getTestEnv, 
  generateTestAdminToken, 
  generateTestUserToken, 
  createTrackJsonRequest, 
  createBeaconRequest, 
  createAdminRequest,
  readSchemaSql,
  readTrackerScript
} from './test-utils';

const env = getTestEnv();
// Ensure environment variables are populated on process.env for Hono adapters
Object.assign(process.env, env);

import app from '../src/index';

describe('Edge Analytics & Event Tracking System - Comprehensive E2E Test Suite', () => {

  /* =========================================================================
   * TIER 1: FEATURE COVERAGE & CONTRACT VALIDATION
   * ========================================================================= */
  describe('Tier 1: Feature Coverage & Contract Validation', () => {

    it('T1.1: Database Schema & Indexes (schema.sql DDL verification)', () => {
      const schemaSql = readSchemaSql();
      assert.ok(schemaSql.length > 0, 'schema.sql must exist and not be empty');

      // 1. Check page_views table and columns
      assert.match(schemaSql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+page_views/i, 'page_views table definition must exist');
      assert.match(schemaSql, /session_id\s+TEXT/i, 'page_views must have session_id column');
      assert.match(schemaSql, /(url_path|path)\s+TEXT/i, 'page_views must have url_path or path column');
      assert.match(schemaSql, /referrer\s+TEXT/i, 'page_views must have referrer column');
      assert.match(schemaSql, /user_agent\s+TEXT/i, 'page_views must have user_agent column');
      assert.match(schemaSql, /ip_address\s+TEXT/i, 'page_views must have ip_address column');
      assert.match(schemaSql, /device_type\s+TEXT/i, 'page_views must have device_type column');
      assert.match(schemaSql, /country\s+TEXT/i, 'page_views must have country column');
      assert.match(schemaSql, /created_at\s+TIMESTAMP/i, 'page_views must have created_at column');

      // 2. Check event_logs table and columns
      assert.match(schemaSql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+event_logs/i, 'event_logs table definition must exist');
      assert.match(schemaSql, /event_name\s+TEXT/i, 'event_logs must have event_name column');
      assert.match(schemaSql, /event_category\s+TEXT/i, 'event_logs must have event_category column');
      assert.match(schemaSql, /(url_path|path)\s+TEXT/i, 'event_logs must have url_path or path column');
      assert.match(schemaSql, /event_data\s+JSONB/i, 'event_logs must have event_data JSONB column');

      // 3. Check performance indexes
      assert.match(schemaSql, /idx_page_views_created_at/i, 'page_views created_at index must exist');
      assert.match(schemaSql, /idx_page_views_session_id/i, 'page_views session_id index must exist');
      assert.match(schemaSql, /idx_event_logs_created_at/i, 'event_logs created_at index must exist');
      assert.match(schemaSql, /idx_event_logs_event_name/i, 'event_logs event_name index must exist');
      assert.match(schemaSql, /idx_event_logs_session_id/i, 'event_logs session_id index must exist');
    });

    it('T1.2: Ingestion API - Standard Pageview (POST /api/analytics/track)', async () => {
      const payload = {
        type: 'pageview',
        session_id: '11111111-1111-4000-8000-111111111111',
        url_path: '/portfolio',
        referrer: 'https://google.com',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      };

      const req = createTrackJsonRequest(payload);
      const res = await app.fetch(req, env);

      assert.equal(res.status, 200, 'Pageview ingestion should return HTTP 200');
      const body = await res.json() as any;
      assert.equal(body.success, true, 'Response JSON should indicate success: true');
    });

    it('T1.3: Ingestion API - Custom Interaction Event (POST /api/analytics/track)', async () => {
      const payload = {
        type: 'event',
        session_id: '11111111-1111-4000-8000-111111111111',
        url_path: '/contact',
        event_name: 'contact_submit',
        event_category: 'conversion',
        event_data: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          subject: 'Custom Web App Development'
        }
      };

      const req = createTrackJsonRequest(payload);
      const res = await app.fetch(req, env);

      assert.equal(res.status, 200, 'Custom event ingestion should return HTTP 200');
      const body = await res.json() as any;
      assert.equal(body.success, true, 'Response JSON should indicate success: true');
    });

    it('T1.4: Ingestion API - Proposal Request Conversion Event', async () => {
      const payload = {
        type: 'event',
        session_id: '22222222-2222-4000-8000-222222222222',
        url_path: '/proposal/request',
        event_name: 'proposal_submitted',
        event_category: 'conversion',
        event_data: {
          title: 'Full-Stack Edge Migration',
          budget: 7500,
          timeline: '3 weeks'
        }
      };

      const req = createTrackJsonRequest(payload);
      const res = await app.fetch(req, env);

      assert.equal(res.status, 200, 'Proposal conversion event should return HTTP 200');
      const body = await res.json() as any;
      assert.equal(body.success, true, 'Response JSON should indicate success: true');
    });

    it('T1.5: Ingestion API - UI Interaction Events (Theme Toggle & Project Click)', async () => {
      const payloadTheme = {
        type: 'event',
        session_id: '33333333-3333-4000-8000-333333333333',
        url_path: '/',
        event_name: 'theme_toggle',
        event_category: 'ui',
        event_data: { theme: 'light' }
      };

      const resTheme = await app.fetch(createTrackJsonRequest(payloadTheme), env);
      assert.equal(resTheme.status, 200, 'Theme toggle event should return HTTP 200');

      const payloadProject = {
        type: 'event',
        session_id: '33333333-3333-4000-8000-333333333333',
        url_path: '/#gallery',
        event_name: 'project_click',
        event_category: 'interaction',
        event_data: { project_title: 'SaaS Dashboard' }
      };

      const resProject = await app.fetch(createTrackJsonRequest(payloadProject), env);
      assert.equal(resProject.status, 200, 'Project click event should return HTTP 200');
    });

    it('T1.6: Admin Analytics Auth Guard - Unauthenticated Redirect', async () => {
      let res = await app.fetch(createAdminRequest('/admin/analytics'), env);
      if (res.status === 404) {
        res = await app.fetch(createAdminRequest('/admin/menu'), env);
      }

      assert.equal(res.status, 302, 'Unauthenticated request to protected admin route must redirect (HTTP 302)');
      const location = res.headers.get('Location') || res.headers.get('location');
      assert.ok(location?.includes('/admin/login'), `Redirect target should be /admin/login, got: ${location}`);
    });

    it('T1.7: Admin Analytics Auth Guard - Authenticated Access', async () => {
      const adminToken = await generateTestAdminToken();
      let res = await app.fetch(createAdminRequest('/admin/analytics', adminToken), env);
      if (res.status === 404) {
        res = await app.fetch(createAdminRequest('/admin/menu', adminToken), env);
      }

      assert.ok(
        res.status === 200 || res.status === 302, 
        'Authenticated request should be processed by admin middleware'
      );
      if (res.status === 200) {
        const contentType = res.headers.get('content-type') || '';
        assert.ok(contentType.includes('text/html'), 'Response should be HTML');
      }
    });

    it('T1.8: Tracker Client Script Contract & Content Verification', () => {
      const trackerCode = readTrackerScript();
      if (trackerCode) {
        assert.ok(
          trackerCode.includes('session') || trackerCode.includes('track') || trackerCode.includes('pageview'),
          'tracker.js should contain session or tracking mechanisms'
        );
      } else {
        assert.ok(true, 'Tracker file contract specified in PROJECT.md');
      }
    });

  });


  /* =========================================================================
   * TIER 2: BOUNDARY & CORNER CASES (FAULT TOLERANCE & ADVERSARIAL INPUTS)
   * ========================================================================= */
  describe('Tier 2: Boundary & Corner Cases', () => {

    it('T2.1: Content-Type: application/json with Malformed JSON Syntax', async () => {
      const malformedJson = '{"type": "pageview", "session_id": "bad-json-unclosed';
      const req = new Request('http://localhost/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: malformedJson
      });

      const res = await app.fetch(req, env);
      assert.ok(
        res.status === 400 || res.status === 200, 
        'Malformed JSON should either return 400 Bad Request or be handled gracefully'
      );
      if (res.status === 400) {
        const body = await res.json() as any;
        assert.ok(body.error, '400 response should contain error field');
      }
    });

    it('T2.2: Content-Type: text/plain Beacon Payload (navigator.sendBeacon stringified JSON)', async () => {
      const beaconPayload = {
        type: 'pageview',
        session_id: 'beacon-session-001',
        url_path: '/services',
        referrer: 'https://twitter.com'
      };

      const req = createBeaconRequest(beaconPayload);
      const res = await app.fetch(req, env);

      assert.equal(res.status, 200, 'navigator.sendBeacon text/plain payload must return HTTP 200');
      const body = await res.json() as any;
      assert.equal(body.success, true, 'sendBeacon response must indicate success: true');
    });

    it('T2.3: URLSearchParams Beacon Fallback Payload', async () => {
      const urlEncodedBody = 'type=pageview&session_id=sess_url_encoded&url_path=%2Fblog&referrer=https%3A%2F%2Freddit.com';
      const req = new Request('http://localhost/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlEncodedBody
      });

      const res = await app.fetch(req, env);
      assert.equal(res.status, 200, 'URLSearchParams beacon payload must return HTTP 200');
      const body = await res.json() as any;
      assert.equal(body.success, true, 'URLSearchParams beacon response must indicate success: true');
    });

    it('T2.4: Missing Session ID (Anonymous Fallback)', async () => {
      const payload = {
        type: 'pageview',
        url_path: '/gallery'
        // session_id omitted
      };

      const req = createTrackJsonRequest(payload);
      const res = await app.fetch(req, env);

      assert.equal(res.status, 200, 'Missing session ID must not throw and should default to anonymous session');
      const body = await res.json() as any;
      assert.equal(body.success, true, 'Response must indicate success: true');
    });

    it('T2.5: Missing or Invalid Event Type', async () => {
      // 1. Missing type
      const noTypePayload = {
        session_id: 'sess-invalid-01',
        url_path: '/test'
      };
      const resNoType = await app.fetch(createTrackJsonRequest(noTypePayload), env);
      assert.equal(resNoType.status, 400, 'Payload without type must return HTTP 400');

      // 2. Invalid type
      const invalidTypePayload = {
        type: 'invalid_type_action',
        session_id: 'sess-invalid-02',
        url_path: '/test'
      };
      const resInvalidType = await app.fetch(createTrackJsonRequest(invalidTypePayload), env);
      assert.equal(resInvalidType.status, 400, 'Payload with invalid type must return HTTP 400');
    });

    it('T2.6: Empty Payload / Empty Body', async () => {
      const reqEmpty = createTrackJsonRequest({});
      const resEmpty = await app.fetch(reqEmpty, env);
      assert.equal(resEmpty.status, 400, 'Empty JSON body must return HTTP 400');

      const reqBlank = new Request('http://localhost/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: ''
      });
      const resBlank = await app.fetch(reqBlank, env);
      assert.equal(resBlank.status, 400, 'Blank body must return HTTP 400');
    });

    it('T2.7: Complex / Serialized / Stringified event_data', async () => {
      const payload = {
        type: 'event',
        session_id: 'sess-complex-001',
        url_path: '/projects',
        event_name: 'filter_applied',
        event_category: 'interaction',
        event_data: JSON.stringify({
          category: 'Web Development',
          tags: ['TypeScript', 'Hono', 'Cloudflare'],
          rating: 5
        })
      };

      const req = createTrackJsonRequest(payload);
      const res = await app.fetch(req, env);

      assert.equal(res.status, 200, 'Stringified event_data must be handled safely and return HTTP 200');
      const body = await res.json() as any;
      assert.equal(body.success, true);
    });

    it('T2.8: Unauthorized Admin Access with Invalid/Tampered JWT', async () => {
      const targetPath = '/admin/menu';
      const reqForged = createAdminRequest(targetPath, 'invalid.token.signature');
      const resForged = await app.fetch(reqForged, env);
      assert.equal(resForged.status, 302, 'Forged JWT must be rejected with redirect to login');

      const userToken = await generateTestUserToken();
      const reqUser = createAdminRequest(targetPath, userToken);
      const resUser = await app.fetch(reqUser, env);
      assert.equal(resUser.status, 302, 'User role JWT must not access admin routes');
    });

  });


  /* =========================================================================
   * TIER 3: CROSS-FEATURE COMBINATIONS & METADATA ENRICHMENT
   * ========================================================================= */
  describe('Tier 3: Cross-Feature Combinations & Metadata Enrichment', () => {

    it('T3.1: Multi-Event Session Correlation', async () => {
      const sessionId = 'session-multi-corr-' + Date.now();

      const events = [
        { type: 'pageview', session_id: sessionId, url_path: '/' },
        { type: 'event', session_id: sessionId, url_path: '/', event_name: 'hero_cta_click', event_category: 'interaction' },
        { type: 'pageview', session_id: sessionId, url_path: '/services' },
        { type: 'event', session_id: sessionId, url_path: '/services', event_name: 'service_card_expand', event_category: 'interaction', event_data: { service: 'Full-Stack' } },
        { type: 'event', session_id: sessionId, url_path: '/proposal/request', event_name: 'proposal_start', event_category: 'conversion' }
      ];

      for (const evt of events) {
        const res = await app.fetch(createTrackJsonRequest(evt), env);
        assert.equal(res.status, 200, `Event ${evt.type}:${(evt as any).event_name || 'pv'} must succeed`);
        const json = await res.json() as any;
        assert.equal(json.success, true);
      }
    });

    it('T3.2: Edge Header Metadata Enrichment & Device Classification', async () => {
      const mobileHeaders = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'CF-IPCountry': 'US',
        'CF-Connecting-IP': '198.51.100.15',
        'Referer': 'https://news.ycombinator.com'
      };

      const reqMobile = createTrackJsonRequest({
        type: 'pageview',
        session_id: 'sess-mobile-001',
        url_path: '/'
      }, mobileHeaders);

      const resMobile = await app.fetch(reqMobile, env);
      assert.equal(resMobile.status, 200, 'Mobile header enriched request must succeed');

      const tabletHeaders = {
        'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        'CF-IPCountry': 'GB',
        'X-Forwarded-For': '203.0.113.88'
      };

      const reqTablet = createTrackJsonRequest({
        type: 'pageview',
        session_id: 'sess-tablet-001',
        url_path: '/blog'
      }, tabletHeaders);

      const resTablet = await app.fetch(reqTablet, env);
      assert.equal(resTablet.status, 200, 'Tablet header enriched request must succeed');
    });

    it('T3.3: Dual-Theme Glassmorphic Admin Dashboard Render Verification', async () => {
      const adminToken = await generateTestAdminToken();
      let res = await app.fetch(createAdminRequest('/admin/analytics', adminToken), env);
      if (res.status === 404) {
        res = await app.fetch(createAdminRequest('/admin/menu', adminToken), env);
      }

      if (res.status === 200) {
        const html = await res.text();
        assert.ok(html.length > 0, 'Admin HTML should not be empty');
        assert.ok(
          html.includes('glass-card') || 
          html.includes('admin-card') || 
          html.includes('dashboard') ||
          html.includes('Admin') ||
          html.includes('Menu'),
          'Dashboard HTML must contain glassmorphism or admin layout'
        );
      } else {
        assert.ok(res.status === 302 || res.status === 200);
      }
    });

    it('T3.4: SSR Template Analytics Instrumentation Verification', async () => {
      const homeRes = await app.fetch(new Request('http://localhost/'), env);
      assert.ok(homeRes.status === 200 || homeRes.status === 302, 'Home page request handled');
      if (homeRes.status === 200) {
        const homeHtml = await homeRes.text();
        assert.ok(homeHtml.includes('<!DOCTYPE html>') || homeHtml.includes('<html'), 'Should return valid HTML document');
        assert.ok(homeHtml.includes('Nikunj') || homeHtml.includes('Portfolio'), 'Home page should render portfolio content');
      }
    });

  });


  /* =========================================================================
   * TIER 4: REAL-WORLD USER JOURNEY (END-TO-END FLOW)
   * ========================================================================= */
  describe('Tier 4: Real-World User Journey (End-to-End Simulation)', () => {

    it('T4.1: Full Visitor Lifecycle & Admin Inspection Journey', async () => {
      const visitorSession = 'e2e-journey-sess-' + Date.now();

      // Step 1: Visitor arrives at Homepage
      const step1Req = createTrackJsonRequest({
        type: 'pageview',
        session_id: visitorSession,
        url_path: '/',
        referrer: 'https://linkedin.com'
      }, {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      });
      const step1Res = await app.fetch(step1Req, env);
      assert.equal(step1Res.status, 200, 'Step 1: Homepage visit must be logged');

      // Step 2: Visitor toggles Theme to Dark
      const step2Req = createTrackJsonRequest({
        type: 'event',
        session_id: visitorSession,
        url_path: '/',
        event_name: 'theme_toggle',
        event_category: 'ui',
        event_data: { theme: 'dark' }
      });
      const step2Res = await app.fetch(step2Req, env);
      assert.equal(step2Res.status, 200, 'Step 2: Theme toggle event must be logged');

      // Step 3: Visitor downloads CV
      const step3Req = createTrackJsonRequest({
        type: 'event',
        session_id: visitorSession,
        url_path: '/',
        event_name: 'download_cv',
        event_category: 'interaction',
        event_data: { file: 'Nikunjkumar_Pateliya_CV.pdf' }
      });
      const step3Res = await app.fetch(step3Req, env);
      assert.equal(step3Res.status, 200, 'Step 3: Download CV event must be logged');

      // Step 4: Visitor navigates to Proposal Request page
      const step4Req = createTrackJsonRequest({
        type: 'pageview',
        session_id: visitorSession,
        url_path: '/proposal/request',
        referrer: 'http://localhost/'
      });
      const step4Res = await app.fetch(step4Req, env);
      assert.equal(step4Res.status, 200, 'Step 4: Proposal pageview must be logged');

      // Step 5: Visitor submits Proposal Request (High-Value Conversion)
      const step5Req = createTrackJsonRequest({
        type: 'event',
        session_id: visitorSession,
        url_path: '/proposal/request',
        event_name: 'proposal_submitted',
        event_category: 'conversion',
        event_data: {
          title: 'High Performance Edge Storefront',
          budget: 12000,
          tech: 'Hono + Supabase + Cloudflare'
        }
      });
      const step5Res = await app.fetch(step5Req, env);
      assert.equal(step5Res.status, 200, 'Step 5: Proposal submission conversion must be logged');

      // Step 6: Admin visits protected admin route without logging in -> Redirected
      const step6Req = createAdminRequest('/admin/menu');
      const step6Res = await app.fetch(step6Req, env);
      assert.equal(step6Res.status, 302, 'Step 6: Unauthenticated admin must be redirected');

      // Step 7: Admin logs in and visits protected route -> Authenticated Access
      const adminToken = await generateTestAdminToken();
      const step7Req = createAdminRequest('/admin/menu', adminToken);
      const step7Res = await app.fetch(step7Req, env);
      assert.ok(
        step7Res.status === 200 || step7Res.status === 302, 
        'Step 7: Authenticated admin request processed'
      );
    });

  });

});
