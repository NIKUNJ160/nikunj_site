# Project: Responsive Layouts, Mobile Navigation Drawer & UI/UX Optimization

## Architecture
- **Framework**: Hono running on Vercel / Node (`src/index.ts`, `src/templates.ts`, `api/index.ts`).
- **Templating**: Server-side rendered HTML templates returning semantic, accessible markup.
- **Styling Architecture**: Modern CSS (`public/assets/css/style.css`) using CSS Custom Properties (Theme tokens), Container Queries (`container-type: inline-size;`), CSS Grid (`minmax(min(100%, 280px), 1fr)`), Flexbox, and fluid typography (`clamp()`).
- **Client Scripting**: Native Vanilla JavaScript (`public/assets/js/main.js`) with GSAP & ScrollTrigger animation lifecycle management.
- **Type Checking**: TypeScript (`tsconfig.json`, `npm run typecheck`).

## Code Layout
- `src/templates.ts`: All HTML template functions (`layout()`, `homePage()`, `adminMenuPage()`, `clientDashboardPage()`, `proposalPage()`, etc.).
- `src/index.ts`: Application routes, auth guards, Supabase integration.
- `public/assets/css/style.css`: Global styles, layout systems, themes, responsive media queries, container query adaptations, navigation drawer & animations.
- `public/assets/js/main.js`: Client interaction logic, mobile navigation drawer controller, theme toggler, GSAP ScrollTrigger and curtain transition handling.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Mobile Hamburger Button | Add accessible hamburger toggle button to navbar header for viewports < 768px | M1 | ORIGINAL_REQUEST §1 |
| 2 | Mobile Slide-Out Drawer Markup | Implement drawer markup (`#mobileDrawer`, `#nav-backdrop`, close button, nav links, role actions) in `src/templates.ts` | M1 | ORIGINAL_REQUEST §1 |
| 3 | Drawer CSS & Transitions | Smooth GPU-accelerated slide-out drawer (`transform: translateX(100%)` to `0`), backdrop blur, body scroll locking, touch targets >= 44px | M1 | ORIGINAL_REQUEST §1 |
| 4 | Drawer Client JS Controller | Wire open/close, toggle, backdrop click, nav link click, Escape key, and window resize listeners in `main.js` | M1 | ORIGINAL_REQUEST §1 |
| 5 | Desktop Navigation Preservation | Horizontal capsule navbar display for viewports >= 768px with unified header actions | M1 | ORIGINAL_REQUEST §1 |
| 6 | Container Queries & Grid Modernization | Refactor `.section-container`, `.dashboard-grid`, `.services-grid`, `.gallery-list`, `.testimonials-grid`, `.blog-grid` using container queries and responsive minmax columns | M2 | ORIGINAL_REQUEST §2 |
| 7 | Zero Horizontal Overflow (320px) | Eliminate fixed min-widths (`.about-col`, form inputs, grids, footers) to guarantee zero scrollbars on 320px+ viewports | M2 | ORIGINAL_REQUEST §2 |
| 8 | Responsive Tables & Bento Styling | Add `.table-responsive` wrappers for data tables in Admin & Client Portal, and define missing `.bento-box` glass styles | M2 | ORIGINAL_REQUEST §2 |
| 9 | Fluid Typography Scaling | Implement responsive font scaling using `clamp()` across hero titles, section headers, and dashboard headings without text clipping | M2 | ORIGINAL_REQUEST §2 |
| 10 | Dark/Light Theme Preservation | Ensure drawer, backdrop, and all responsive components utilize CSS variables and switch cleanly without class conflict | M3 | ORIGINAL_REQUEST §3 |
| 11 | GSAP & ScrollTrigger Compatibility | Verify ScrollTrigger animations work accurately across all viewports; trigger `ScrollTrigger.refresh()` on layout updates; fix in-page anchor links | M3 | ORIGINAL_REQUEST §3 |
| 12 | End-to-End Responsive & Typecheck Validation | Validate all breakpoints (320px to 1440px), verify zero horizontal overflow, and ensure `npm run typecheck` passes with exit code 0 | M4 | ORIGINAL_REQUEST §4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Collapsible Slide-Out Mobile Navigation Drawer | Hamburger button, mobile drawer HTML/CSS/JS, smooth transitions, desktop >= 768px preservation | none | PLANNED |
| M2 | Responsive Layouts & CSS Modernization | Container queries, flexbox/grid refactoring, 320px overflow elimination, table scrollers, bento styling | M1 | PLANNED |
| M3 | Theme Switching & GSAP Animation Preservation | Dual theme support in drawer/components, ScrollTrigger lifecycle & refresh, in-page anchor link fixes | M1, M2 | PLANNED |
| M4 | Final Validation & Typecheck Verification | Full multi-viewport audit (320px to 1440px), zero overflow checks, `npm run typecheck` exit code 0 | M1, M2, M3 | PLANNED |

## Interface Contracts
### Navbar & Drawer DOM Contract (`src/templates.ts` ↔ `public/assets/js/main.js`)
- `#navToggle`: Toggle button element with `aria-controls="mobileDrawer"` and `aria-expanded="false|true"`.
- `#mobileDrawer`: Navigation drawer element with `aria-hidden="true|false"`, class `.open` when active.
- `#navBackdrop`: Backdrop overlay element with class `.active` when active.
- `#drawerClose`: Close button element inside `#mobileDrawer`.
- `.drawer-link`: Navigation links inside drawer; clicking any drawer link closes drawer and navigates/scrolls.
- `body.drawer-open`: Class applied to `document.body` to prevent background scrolling when drawer is open.

### Theme Contract (`public/assets/css/style.css` ↔ `public/assets/js/main.js`)
- `document.documentElement.className`: Holds `dark-theme` or `light-theme`.
- CSS custom properties `--bg-primary`, `--bg-secondary`, `--bg-glass`, `--bg-glass-hover`, `--text-primary`, `--text-secondary`, `--border-glass`, `--shadow-glass`, `--accent-color` must be consumed by all UI components.
