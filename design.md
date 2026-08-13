# Design System — nikunj-portfolio

> Living reference for the visual language of [nikunjpateliya.com](https://nikunjpateliya.com).
> Last updated: August 2026

---

## 1. Design Philosophy

**"Dual-State Architectural Glassmorphism"** — a refined, tactile interface that transitions smoothly between a light, clean alabaster theme and a deep, low-contrast slate dark theme. The visual language uses soft, layered frosted-glass surfaces and organic green accents. It completely avoids high-saturation neon elements, purples, or hot pinks, preferring a structured, editorial aesthetic with deep natural tones.

### Guiding Principles

| # | Principle | How it manifests |
| --- | --- | --- |
| 1 | **Depth over decoration** | Glass cards float above the canvas via layered `backdrop-filter`, inner highlights, and multi-stop shadows tailored to the light/dark active state. |
| 2 | **Motion with purpose** | Smooth background gradient shifts + hover-bound elevation changes create interaction; all transitions use a single custom easing `cubic-bezier(0.16, 1, 0.3, 1)`. |
| 3 | **Content emerges** | Skeleton shimmer → real data hydration; sections fade-in on scroll intersection — the page reveals itself. |
| 4 | **Refined, Natural Palette** | Forest Green / Soft Sage is the primary accent; support colors are kept to muted slate grays and organic earth tones. No neon violet, cyan, or purple is used. |

---

## 2. Color Palette

The design system supports both **Dark Mode** (default) and **Light Mode** through semantic CSS custom properties.

### Backgrounds

| Token | Light Mode Value | Dark Mode Value | Usage |
| --- | --- | --- | --- |
| `--bg-primary` | `#F8F9FA` (Alabaster) | `#0E1013` (Slate Black) | Page canvas |
| `--bg-secondary` | `#F1F3F5` (Cool Slate) | `#15181C` (Deep Charcoal) | Section alternate background |
| `--bg-glass` | `rgba(255, 255, 255, 0.65)` | `rgba(25, 28, 33, 0.45)` | Glass surface default |
| `--bg-glass-hover` | `rgba(255, 255, 255, 0.85)` | `rgba(32, 36, 43, 0.65)` | Glass surface on hover |

### Text

| Token | Light Mode Value | Dark Mode Value | Usage |
| --- | --- | --- | --- |
| `--text-primary` | `#1A1C1E` (Off-black) | `#FFFFFF` (Pure White) | Headings, names, CTAs |
| `--text-secondary` | `#4E5158` (Muted Charcoal) | `#A3A8B6` (Warm Gray) | Body copy, descriptions |
| `--text-muted` | `#7E828C` (Light Slate) | `#646975` (Muted Slate) | Labels, footnotes, timestamps |

### Accents & Gradients

| Token | Light Mode Value | Dark Mode Value | Usage |
| --- | --- | --- | --- |
| `--accent-color` | `#059669` (Forest Green) | `#10B981` (Emerald) | Primary interactive color — buttons, links, tag hovers |
| `--accent-secondary` | `#047857` (Deep Emerald) | `#34D399` (Mint Green) | Supporting accent elements, tag borders |
| `--accent-gradient` | `135deg #059669 → #10B981` | `135deg #10B981 → #047857` | Primary CTA button fill |

### Borders & Shadows

| Token | Light Mode Value | Dark Mode Value |
| --- | --- | --- |
| `--border-glass` | `rgba(0, 0, 0, 0.06)` | `rgba(255, 255, 255, 0.07)` |
| `--border-glass-hover` | `rgba(5, 150, 105, 0.3)` | `rgba(16, 185, 129, 0.35)` |
| `--shadow-glass` | `0 16px 40px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.7)` | `0 16px 40px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.05)` |
| `--shadow-glass-hover` | `0 24px 60px rgba(0,0,0,0.08), 0 0 30px rgba(5,150,105,0.05)` | `0 24px 60px rgba(0,0,0,0.6), 0 0 30px rgba(16,185,129,0.15)` |

---

## 3. Typography

| Role | Font | Weight | Notes |
|---|---|---|---|
| Headings | Inter | 700–800 | `letter-spacing: -0.02em` to -0.03em; gradient fill on hero title |
| Body | Inter | 400–500 | `line-height: 1.6` (body), `1.7` (descriptions), `1.8` (about bio) |
| Monospace | JetBrains Mono | 400–500 | Tags, status pill, small labels |

### Fluid Scale (Hero)
```
font-size: clamp(3.5rem, 6.5vw, 6rem)  → desktop hero
font-size: 2.25rem                       → tablet (≤768px)
font-size: 1.85rem                       → phone (≤480px)
```

### Section Headings
All section `<h2>` headings use inline `font-size: 2.5rem` with `margin-bottom: 2rem` — no variation between sections. This is a known issue (see Weaknesses below).

---

## 4. Layout System

### Grid Container
- Max width: `1200px`, centered with `padding: 0 24px`
- Section vertical padding: `100px` (consistent across all sections)

### Bento Grid (Projects)
```css
grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
gap: 30px;
```

### Services Grid
```css
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: 30px;
```

### About Grid
```css
grid-template-columns: 1fr 1fr;  → collapses to 1fr at ≤992px
gap: 4rem;
```

---

## 5. Component Library

### Navigation — Floating Capsule
- Fixed to `bottom: 2rem`, centered via `left: 50%; transform: translateX(-50%)`
- `border-radius: 99px` (perfect pill)
- Glass background `var(--bg-glass)` + `backdrop-filter: blur(24px) saturate(180%)`
- Contains: logo circle (36px), nav links, primary CTA pill button

### Status Pill
- Fixed `right: 2rem; top: 2rem`
- Mono font, `var(--border-glass-hover)` highlight, "● Open to Work"

### Progress Bar (Top Preloader)
- 3px height, `var(--accent-gradient)` fill, fixed to viewport top
- Animates `width: 0% → 30% → 60% → 100%` during API data fetch
- Fades out on completion

### Glass Card (`.glass`)
```css
background: var(--bg-glass);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid var(--border-glass);
box-shadow: var(--shadow-glass);
```

### Project Card
- Glass card + `border-radius: 24px`
- Thumbnail: `aspect-ratio: 16/10`, scales 1.04x on hover
- Card lifts `translateY(-8px) scale(1.015)` on hover
- Tags turn `var(--accent-color)` on hover; title turns `var(--accent-color)` on hover
- Arrow link shifts `translateX(4px)` on hover

### Skill Pill
- `border-radius: 99px`, near-transparent background
- On hover: lifts, scales 1.05x, `var(--border-glass-hover)` border highlight

### Button (`.btn`)
- Gradient fill `var(--accent-gradient)`, high-contrast text, pill shape
- `::before` shimmer sweep on hover (left to right light band)
- Lifts `translateY(-3px) scale(1.02)` + intensified drop shadow

### Button Outline (`.btn-outline`)
- Transparent + glass border, `var(--text-primary)` text
- Hover: slight background opacity increase, brighter border

---

## 6. Animation & Motion

| Animation | Duration | Easing / Curve | Trigger |
| --- | --- | --- | --- |
| Ambient background drift (1, 2, 3) | 25–30s | `ease-in-out` alternate | Continuous CSS keyframes |
| Cursor light shift | per-frame | `lerp(0.06)` in rAF | Mousemove |
| Card hover lift | 400ms | `cubic-bezier(0.16, 1, 0.3, 1)` | `:hover` |
| Scroll-reveal fade-in | 800ms | `power3.out` | GSAP ScrollTrigger |
| Bento grid stagger | 150ms delay | `power2.out` | GSAP ScrollTrigger (stagger) |
| Inertial smooth scroll | continuous | lerp damping `0.08` | Locomotive Scroll |
| Page curtain wipe | 1200ms | `power4.inOut` | Page Transition Router |
| Button shimmer sweep | 600ms | `ease-in-out` | `:hover` |
| Shimmer skeleton | 1600ms | `linear` infinite | While loading |
| Progress bar | 300ms | `ease` | Width transitions |

### 6.1 Scroll & Motion Framework (GSAP & Locomotive Scroll)

To achieve a premium, tactile, and responsive feel, the site integrates **GSAP (GreenSock Animation Platform)**, **ScrollTrigger**, and **Locomotive Scroll** to deliver smooth inertial scrolling and sophisticated scroll-bound animations.

#### Scroll Engine: Locomotive Scroll

- **Smooth Inertial Scrolling:** Mouse wheel inputs are normalized and smoothed with physics-based momentum (`damping: 0.08`, `smartEasing: true`).
- **Scroll Container:** The page wrapper utilizes the `#main-scroll-container` selector with a `data-scroll-container` attribute.
- **GSAP ScrollTrigger Syncing:** Position proxying ensures ScrollTrigger calculations match the inertial scroll container transforms.

  ```javascript
  const locoScroll = new LocomotiveScroll({
    el: document.querySelector("#main-scroll-container"),
    smooth: true
  });

  locoScroll.on("scroll", ScrollTrigger.update);

  ScrollTrigger.scrollerProxy("#main-scroll-container", {
    scrollTop(value) {
      return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.y;
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    },
    pinType: document.querySelector("#main-scroll-container").style.transform ? "transform" : "fixed"
  });

  ScrollTrigger.addEventListener("refresh", () => locoScroll.update());
  ScrollTrigger.refresh();
  ```

#### Scroll-Bound Actions: GSAP ScrollTrigger

- **Tactile Reveal on Scroll:** Sections fade in and slide up dynamically as the user scrolls.
  - *Trigger:* Section entering viewport.
  - *Start/End:* `top 85%` / `top 30%`.
  - *GSAP Config:* `gsap.fromTo(element, { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 85%", toggleActions: "play none none reverse" } })`
- **Dynamic Bento Grid Stagger:** Individual project cards stagger into view sequentially.
  - *Stagger Delay:* `0.15s` between sibling cards.
  - *Easing:* `power2.out`.
- **Parallax Background Elements:** Subtle shift of background grid overlays and noise textures.
  - *Ratio:* Background maps to `yPercent: -15` with `scrub: 1` or `scrub: 1.5`.

### 6.2 Premium Page Transitions (Barba.js + GSAP)

To prevent harsh browser refreshes, a custom page-transition system manages route changes seamlessly using **Barba.js** (or standard route-hijacking) combined with GSAP timelines.

- **Visual Concept:** A high-end dark glass curtain scaling across the screen, hiding content hydration, and sweeping out.
- **Timeline Implementation:**

  ```javascript
  const transitionTimeline = gsap.timeline({ defaults: { ease: "power4.inOut" } });

  transitionTimeline
    // Scale curtain up from bottom to cover viewport
    .to(".transition-curtain", { duration: 0.6, scaleY: 1, transformOrigin: "bottom" })
    // Swap content behind curtain
    .set(".current-page-content", { display: "none" })
    .set(".next-page-content", { display: "block" })
    // Slide/fade new content up
    .fromTo(".next-page-content", { opacity: 0, y: 40 }, { duration: 0.8, opacity: 1, y: 0 })
    // Scale curtain down to top to reveal new page
    .to(".transition-curtain", { duration: 0.6, scaleY: 0, transformOrigin: "top" });
  ```

### 6.3 Reduced Motion Accessibility

For users who prefer reduced motion, a stylesheet override removes all scroll transforms, inertial scroll offsets, and heavy opacity sweeps.

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable Locomotive Scroll smooth scroll */
  #main-scroll-container {
    transform: none !important;
  }
  
  /* Reset GSAP transitions */
  .fade-in,
  .project-card,
  .btn,
  .next-page-content {
    transition: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}
```

---

## 7. Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `≤992px` | About section collapses to single column |
| `≤768px` | Hero shrinks (2.25rem), hero buttons stack vertically, nav spacing tightens |
| `≤576px` | Contact form padding reduces |
| `≤480px` | Hero shrinks further (1.85rem), About/Services nav links hide |

---

## 8. Known Design Weaknesses

1. **No profile photo in hero** — text-only, no face/avatar
2. **No section visual hierarchy** — every section has identical weight/spacing
3. **Services section looks identical to Projects** — no differentiation
4. **Nav logo is 192 KB** for a 36px circle — oversized JPEG
5. **No active nav link state** on scroll
6. **Mobile nav hides links** (About, Services) instead of hamburger
7. **Bio text has no `max-width`** — uncomfortable line lengths on ultrawide
8. **Social links below contact form** — inverted CTA flow
9. **No favicon version cache-busting** — static CSS/JS paths
