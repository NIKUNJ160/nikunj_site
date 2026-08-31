import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vm from 'node:vm';
import { layout, homePage, proposalRequestPage } from '../src/templates';

describe('Milestone 2: Browser Tracker & Template Instrumentation Tests', () => {

  const trackerPath = path.resolve(process.cwd(), 'public/assets/js/tracker.js');

  /* =========================================================================
   * 1. TRACKER SCRIPT FILE INTEGRITY & SIZE TESTS
   * ========================================================================= */
  describe('1. Tracker Script Integrity & Size (< 3KB)', () => {
    it('should exist in public/assets/js/tracker.js', () => {
      assert.ok(fs.existsSync(trackerPath), 'tracker.js file must exist at public/assets/js/tracker.js');
    });

    it('should be lightweight (< 3000 bytes unminified/raw payload size)', () => {
      const stats = fs.statSync(trackerPath);
      console.log(`tracker.js file size: ${stats.size} bytes`);
      // The requirement states < 3KB
      assert.ok(stats.size < 3072, `tracker.js file size (${stats.size} bytes) must be less than 3KB (3072 bytes)`);
    });
  });

  /* =========================================================================
   * 2. TRACKER FUNCTIONAL RUNTIME & BEHAVIOR TESTS (VM Sandbox)
   * ========================================================================= */
  describe('2. Tracker Functional Runtime & Event Delegation', () => {
    
    function createMockBrowser() {
      const payloadsSent: any[] = [];
      const sessionStore: Record<string, string> = {};
      const clickListeners: Function[] = [];
      const submitListeners: Function[] = [];

      const mockDocument = {
        readyState: 'complete',
        referrer: 'https://referrer.example.com',
        title: 'Portfolio Test Title',
        addEventListener: (event: string, handler: Function, _opts?: any) => {
          if (event === 'click') clickListeners.push(handler);
          if (event === 'submit') submitListeners.push(handler);
        }
      };

      const mockSessionStorage = {
        getItem: (k: string) => sessionStore[k] || null,
        setItem: (k: string, v: string) => { sessionStore[k] = v; },
        removeItem: (k: string) => { delete sessionStore[k]; }
      };

      const mockNavigator = {
        userAgent: 'MockBrowser/1.0 (Test Environment)',
        language: 'en-US',
        sendBeacon: (url: string, data: any) => {
          // Parse Blob or string
          payloadsSent.push({ transport: 'sendBeacon', url, data });
          return true;
        }
      };

      const mockWindow: any = {
        location: {
          pathname: '/portfolio',
          search: '?filter=web'
        },
        screen: {
          width: 1920,
          height: 1080
        },
        innerWidth: 1440,
        innerHeight: 900,
        sessionStorage: mockSessionStorage,
        navigator: mockNavigator,
        document: mockDocument,
        Blob: class MockBlob {
          content: any;
          type: string;
          constructor(chunks: any[], opts?: any) {
            this.content = chunks.join('');
            this.type = opts?.type || '';
          }
        },
        fetch: async (url: string, opts: any) => {
          payloadsSent.push({ transport: 'fetch', url, opts });
          return { ok: true };
        },
        crypto: {
          randomUUID: () => '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
        }
      };

      return {
        mockWindow,
        mockDocument,
        mockSessionStorage,
        mockNavigator,
        payloadsSent,
        clickListeners,
        submitListeners
      };
    }

    it('should automatically track initial pageview and set session UUID', () => {
      const browser = createMockBrowser();
      const code = fs.readFileSync(trackerPath, 'utf8');

      const sandbox = {
        window: browser.mockWindow,
        document: browser.mockDocument,
        navigator: browser.mockNavigator,
        sessionStorage: browser.mockSessionStorage,
        Blob: browser.mockWindow.Blob,
        crypto: browser.mockWindow.crypto,
        console: console,
        Date: Date,
        JSON: JSON,
        Number: Number,
        isNaN: isNaN
      };

      vm.createContext(sandbox);
      vm.runInContext(code, sandbox);

      // Verify session ID was generated and stored
      const sessionId = browser.mockSessionStorage.getItem('analytics_session_id');
      assert.equal(sessionId, '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', 'Session UUID must be stored in sessionStorage');

      // Verify auto pageview was sent
      assert.equal(browser.payloadsSent.length, 1, 'Auto pageview should have been sent on init');
      assert.equal(browser.payloadsSent[0].transport, 'sendBeacon');
      assert.equal(browser.payloadsSent[0].url, '/api/analytics/track');

      const payload = JSON.parse(browser.payloadsSent[0].data.content);
      assert.equal(payload.type, 'pageview');
      assert.equal(payload.session_id, '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
      assert.equal(payload.url_path, '/portfolio?filter=web');
      assert.equal(payload.referrer, 'https://referrer.example.com');
      assert.equal(payload.user_agent, 'MockBrowser/1.0 (Test Environment)');
      assert.equal(payload.screen_resolution, '1920x1080');
      assert.equal(payload.viewport_size, '1440x900');
      assert.equal(payload.language, 'en-US');
    });

    it('should expose programmatic APIs window.trackPageView and window.trackEvent', () => {
      const browser = createMockBrowser();
      const code = fs.readFileSync(trackerPath, 'utf8');
      const sandbox = {
        window: browser.mockWindow,
        document: browser.mockDocument,
        navigator: browser.mockNavigator,
        sessionStorage: browser.mockSessionStorage,
        Blob: browser.mockWindow.Blob,
        crypto: browser.mockWindow.crypto,
        console: console,
        Date: Date,
        JSON: JSON,
        Number: Number,
        isNaN: isNaN
      };
      vm.createContext(sandbox);
      vm.runInContext(code, sandbox);

      assert.equal(typeof browser.mockWindow.trackPageView, 'function', 'window.trackPageView must be a function');
      assert.equal(typeof browser.mockWindow.trackEvent, 'function', 'window.trackEvent must be a function');

      // Call trackPageView
      browser.mockWindow.trackPageView('/custom-route');
      const pvPayload = JSON.parse(browser.payloadsSent[1].data.content);
      assert.equal(pvPayload.type, 'pageview');
      assert.equal(pvPayload.url_path, '/custom-route');

      // Call trackEvent
      browser.mockWindow.trackEvent('test_click', { button: 'cta' }, 'conversion');
      const evtPayload = JSON.parse(browser.payloadsSent[2].data.content);
      assert.equal(evtPayload.type, 'event');
      assert.equal(evtPayload.event_name, 'test_click');
      assert.equal(evtPayload.event_category, 'conversion');
      assert.deepEqual(evtPayload.event_data, { button: 'cta' });
    });

    it('should capture declarative click events on elements with data-track-event', () => {
      const browser = createMockBrowser();
      const code = fs.readFileSync(trackerPath, 'utf8');
      const sandbox = {
        window: browser.mockWindow,
        document: browser.mockDocument,
        navigator: browser.mockNavigator,
        sessionStorage: browser.mockSessionStorage,
        Blob: browser.mockWindow.Blob,
        crypto: browser.mockWindow.crypto,
        console: console,
        Date: Date,
        JSON: JSON,
        Number: Number,
        isNaN: isNaN
      };
      vm.createContext(sandbox);
      vm.runInContext(code, sandbox);

      assert.ok(browser.clickListeners.length > 0, 'Click listener should be registered on document');
      const clickHandler = browser.clickListeners[0];

      // Simulate click on tracked element
      const mockElement = {
        tagName: 'A',
        getAttribute: (attr: string) => {
          if (attr === 'data-track-event') return 'cv_download';
          if (attr === 'data-track-category') return 'conversion';
          if (attr === 'data-track-label') return 'cv_pdf';
          if (attr === 'data-track-value') return '100';
          if (attr === 'href') return '/assets/Nikunjkumar_Pateliya_CV.pdf';
          return null;
        },
        closest: function(sel: string) {
          if (sel === '[data-track-event]') return this;
          return null;
        }
      };

      clickHandler({ target: mockElement });

      const lastPayload = JSON.parse(browser.payloadsSent[browser.payloadsSent.length - 1].data.content);
      assert.equal(lastPayload.type, 'event');
      assert.equal(lastPayload.event_name, 'cv_download');
      assert.equal(lastPayload.event_category, 'conversion');
      assert.equal(lastPayload.event_data.label, 'cv_pdf');
      assert.equal(lastPayload.event_data.value, 100);
      assert.equal(lastPayload.event_data.href, '/assets/Nikunjkumar_Pateliya_CV.pdf');
    });

    it('should capture declarative submit events on forms with data-track-event', () => {
      const browser = createMockBrowser();
      const code = fs.readFileSync(trackerPath, 'utf8');
      const sandbox = {
        window: browser.mockWindow,
        document: browser.mockDocument,
        navigator: browser.mockNavigator,
        sessionStorage: browser.mockSessionStorage,
        Blob: browser.mockWindow.Blob,
        crypto: browser.mockWindow.crypto,
        console: console,
        Date: Date,
        JSON: JSON,
        Number: Number,
        isNaN: isNaN
      };
      vm.createContext(sandbox);
      vm.runInContext(code, sandbox);

      assert.ok(browser.submitListeners.length > 0, 'Submit listener should be registered on document');
      const submitHandler = browser.submitListeners[0];

      // Simulate form submit
      const mockForm = {
        tagName: 'FORM',
        hasAttribute: (attr: string) => attr === 'data-track-event',
        getAttribute: (attr: string) => {
          if (attr === 'data-track-event') return 'contact_form_submit';
          if (attr === 'data-track-category') return 'conversion';
          if (attr === 'data-track-label') return 'contact_form';
          if (attr === 'id') return 'contact-form-id';
          if (attr === 'action') return '/contact';
          return null;
        },
        closest: function(sel: string) {
          if (sel === '[data-track-event]') return this;
          return null;
        }
      };

      submitHandler({ target: mockForm });

      const lastPayload = JSON.parse(browser.payloadsSent[browser.payloadsSent.length - 1].data.content);
      assert.equal(lastPayload.type, 'event');
      assert.equal(lastPayload.event_name, 'contact_form_submit');
      assert.equal(lastPayload.event_category, 'conversion');
      assert.equal(lastPayload.event_data.label, 'contact_form');
      assert.equal(lastPayload.event_data.form_id, 'contact-form-id');
      assert.equal(lastPayload.event_data.action, '/contact');
    });
  });

  /* =========================================================================
   * 3. TEMPLATE INSTRUMENTATION HTML VERIFICATION
   * ========================================================================= */
  describe('3. Template Instrumentation in src/templates.ts', () => {

    it('layout() should inject tracker.js with defer attribute', () => {
      const html = layout('Test Page', '<div>Test Content</div>');
      assert.match(html, /<script\s+src="\/assets\/js\/tracker\.js"\s+defer><\/script>/, 'layout must inject tracker.js script tag');
    });

    it('layout() should contain data-track-event="theme_toggle" on desktop & drawer theme buttons', () => {
      const html = layout('Test Page', '<div>Test Content</div>');
      
      // Desktop theme toggle
      assert.match(html, /id="theme-toggle"[^>]*data-track-event="theme_toggle"/, 'Desktop theme toggle button must have data-track-event="theme_toggle"');
      assert.match(html, /id="theme-toggle"[^>]*data-track-category="ui"/, 'Desktop theme toggle button must have data-track-category="ui"');

      // Drawer theme toggle
      assert.match(html, /id="drawer-theme-toggle"[^>]*data-track-event="theme_toggle"/, 'Drawer theme toggle button must have data-track-event="theme_toggle"');
      assert.match(html, /id="drawer-theme-toggle"[^>]*data-track-category="ui"/, 'Drawer theme toggle button must have data-track-category="ui"');
    });

    it('homePage() should instrument Contact Form, CV Download, Gallery Filters, Projects, and Social Links', () => {
      const dummyData = {
        projects: [],
        skills: [],
        services: [],
        blogPosts: [],
        testimonials: []
      };
      const html = homePage(dummyData);

      // Contact Form
      assert.match(html, /<form[^>]*class="[^"]*contact-form[^"]*"[^>]*data-track-event="contact_form_submit"/, 'Contact form must have data-track-event="contact_form_submit"');
      assert.match(html, /<form[^>]*class="[^"]*contact-form[^"]*"[^>]*data-track-category="conversion"/, 'Contact form must have data-track-category="conversion"');

      // CV Download Button
      assert.match(html, /<a[^>]*href="\/assets\/Nikunjkumar_Pateliya_CV\.pdf"[^>]*data-track-event="cv_download"/, 'CV download button must have data-track-event="cv_download"');
      assert.match(html, /<a[^>]*href="\/assets\/Nikunjkumar_Pateliya_CV\.pdf"[^>]*data-track-category="conversion"/, 'CV download button must have data-track-category="conversion"');

      // Gallery Filter Buttons
      assert.match(html, /<button[^>]*data-filter="all"[^>]*data-track-event="portfolio_filter"/, 'Filter button "all" must have data-track-event="portfolio_filter"');
      assert.match(html, /<button[^>]*data-filter="gal_a"[^>]*data-track-event="portfolio_filter"/, 'Filter button "gal_a" must have data-track-event="portfolio_filter"');
      assert.match(html, /<button[^>]*data-filter="gal_b"[^>]*data-track-event="portfolio_filter"/, 'Filter button "gal_b" must have data-track-event="portfolio_filter"');
      assert.match(html, /<button[^>]*data-filter="gal_c"[^>]*data-track-event="portfolio_filter"/, 'Filter button "gal_c" must have data-track-event="portfolio_filter"');

      // Project Gallery Items
      assert.match(html, /<div[^>]*class="[^"]*gallery-item[^"]*"[^>]*data-track-event="project_click"/, 'Gallery item must have data-track-event="project_click"');
      assert.match(html, /<div[^>]*class="[^"]*gallery-item[^"]*"[^>]*data-track-category="engagement"/, 'Gallery item must have data-track-category="engagement"');

      // Social Links
      assert.match(html, /<a[^>]*href="https:\/\/www\.instagram\.com\/_nik__16\/"[^>]*data-track-event="social_link_click"[^>]*data-track-category="outbound"/, 'Instagram link must have data-track-event="social_link_click" data-track-category="outbound"');
      assert.match(html, /<a[^>]*href="https:\/\/github\.com\/NIKUNJ160"[^>]*data-track-event="social_link_click"[^>]*data-track-category="outbound"/, 'GitHub link must have data-track-event="social_link_click" data-track-category="outbound"');
      assert.match(html, /<a[^>]*href="https:\/\/www\.linkedin\.com\/in\/nikunjpateliya1608"[^>]*data-track-event="social_link_click"[^>]*data-track-category="outbound"/, 'LinkedIn link must have data-track-event="social_link_click" data-track-category="outbound"');
      assert.match(html, /<a[^>]*href="https:\/\/wa\.me\/919328801435"[^>]*data-track-event="social_link_click"[^>]*data-track-category="outbound"/, 'WhatsApp link must have data-track-event="social_link_click" data-track-category="outbound"');
    });

    it('proposalRequestPage() should contain data-track-event on proposal submission form', () => {
      const html = proposalRequestPage();
      assert.match(html, /<form[^>]*action="\/api\/proposals"[^>]*data-track-event="proposal_request_submit"/, 'Proposal request form must have data-track-event="proposal_request_submit"');
      assert.match(html, /<form[^>]*action="\/api\/proposals"[^>]*data-track-category="conversion"/, 'Proposal request form must have data-track-category="conversion"');
    });

  });

});
