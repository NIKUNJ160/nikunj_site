# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary public users are prospective clients, collaborators, employers, or visitors evaluating Nikunj Pateliya's web design and full-stack development work. Their job is to understand the work, skills, services, writing, and contact options quickly enough to decide whether to reach out.

Secondary users are the portfolio owner/admins who need to manage projects, skills, services, contact messages, and blog posts through authenticated admin routes.

## Product Purpose

This product is Nikunj Pateliya's personal portfolio website. It presents selected work, skills, services, an about section, blog posts, social links, and a contact form. Success means visitors can understand Nikunj's capabilities, inspect real work, read related writing, and submit a contact message without friction.

## Positioning

The product is a personal developer/designer portfolio tied to a real individual, real assets, and editable content. It should not behave like a generic agency template or fabricate proof. Its value comes from clearly showing Nikunj's own work, capabilities, services, and writing.

## Operating Context

The public website exposes:

- Home page sections for work, services, about, skills, latest blog posts, and contact.
- Blog listing and individual blog post pages.
- A contact form that stores visitor messages.
- Social links for LinkedIn, GitHub, Instagram, and WhatsApp.

The admin workflow exposes:

- Login and optional registration.
- Project management.
- Skill management.
- Service management.
- Message review and deletion.
- Blog post authoring, publishing, editing, and deletion.

The current codebase runs as a Cloudflare Worker using Hono, TypeScript, static assets, and Cloudflare D1.

## Capabilities and Constraints

- Portfolio data is stored in D1 tables for `users`, `projects`, `messages`, `skills`, `services`, and `blog_posts`.
- Public portfolio data is loaded from `/api/portfolio-data`.
- Contact submissions are rate-limited and persisted in `messages`.
- Admin routes are protected by authentication middleware.
- Registration is disabled by default in production configuration and should only be enabled intentionally.
- Secrets such as JWT signing keys and invite codes must remain outside committed source.
- No implemented neural network, model inference route, embedding pipeline, or AI binding exists in the current source.
- Future neural-network features, if added, should stay behind backend routes and must not expose provider keys in browser code.
- Open decision: the exact live deployment URL and production analytics requirements are not confirmed in the repository.

## Brand Commitments

- Public name: Nikunj Pateliya.
- Public role: Web Designer & Full-Stack Developer.
- Location reference in existing copy: Gujarat.
- Current service labels: Web Design, Development, and SEO & Strategy.
- Existing logo/profile image path: `public/assets/images/logo.jpg`.
- Existing project image assets live under `public/assets/images/projects/`.
- Existing social URLs are present in `src/templates.ts`.
- User-stated future website direction: avoid neon visual treatment and avoid dark-theme-first design.

## Evidence on Hand

- Source routes and workflows: `src/index.ts`.
- Public/admin HTML templates and copy: `src/templates.ts`.
- Environment and database row types: `src/env.ts`.
- Authentication helpers: `src/auth.ts`.
- Database schema: `schema.sql`.
- Public static assets: `public/`.
- Mirrored/static asset folder: `assets/`.
- Technical overview: `TECH_NEURAL_NETWORK_DATABASE.md`.
- Codebase snapshot: `CODEBASE_BACKUP.md`.
- Website generation prompt: `WEBSITE_BUILD_PROMPT.md`.

The repository does not provide confirmed testimonials, client names, revenue metrics, case-study outcomes, certifications, awards, or production traffic data. Future work must not invent those facts.

## Product Principles

- Preserve factual personal identity and source-backed portfolio content.
- Make the visitor's path to work samples, skills, services, writing, and contact obvious.
- Keep admin capabilities private and authenticated.
- Prefer editable structured content over hardcoded portfolio data where persistence is already available.
- Mark missing content as editable or empty rather than filling gaps with fabricated proof.

## Accessibility & Inclusion

The project is a public web portfolio and should keep navigation, forms, buttons, and blog content accessible by default. Future work should preserve semantic HTML, readable contrast, keyboard-accessible controls, responsive layouts, form labels, validation states, and reduced-motion fallbacks where animation is used.
