export function layout(title: string, content: string, description: string = "Portfolio of Nikunj Pateliya", role?: 'admin' | 'user'): string {
  let roleHtml = '';
  let drawerRoleHtml = '';
  if (role === 'admin') {
    roleHtml = `
      <li><a class="nav-link" href="/admin/menu">Admin Panel</a></li>
      <li>
        <form action="/admin/logout" method="POST" style="display:inline; margin:0; padding:0;">
          <button type="submit" class="nav-link-btn" style="background:none; border:1px solid var(--border-glass); color:var(--text-primary); cursor:pointer; font-weight:600; font-size:0.85rem; padding:6px 16px; border-radius:99px;">Logout</button>
        </form>
      </li>
    `;
    drawerRoleHtml = `
      <li><a class="drawer-link" href="/admin/menu">Admin Panel</a></li>
      <li>
        <form action="/admin/logout" method="POST" style="margin:0; padding:0;">
          <button type="submit" class="drawer-link drawer-btn-logout" style="width:100%; text-align:left; background:none; border:1px solid var(--border-glass); color:var(--text-primary); cursor:pointer; font-weight:600; font-size:1rem; padding:12px 16px; border-radius:12px;">Logout</button>
        </form>
      </li>
    `;
  } else if (role === 'user') {
    roleHtml = `
      <li><a class="nav-link" href="/client/dashboard">My Portal</a></li>
      <li>
        <form action="/user/logout" method="POST" style="display:inline; margin:0; padding:0;">
          <button type="submit" class="nav-link-btn" style="background:none; border:1px solid var(--border-glass); color:var(--text-primary); cursor:pointer; font-weight:600; font-size:0.85rem; padding:6px 16px; border-radius:99px;">Logout</button>
        </form>
      </li>
    `;
    drawerRoleHtml = `
      <li><a class="drawer-link" href="/client/dashboard">My Portal</a></li>
      <li>
        <form action="/user/logout" method="POST" style="margin:0; padding:0;">
          <button type="submit" class="drawer-link drawer-btn-logout" style="width:100%; text-align:left; background:none; border:1px solid var(--border-glass); color:var(--text-primary); cursor:pointer; font-weight:600; font-size:1rem; padding:12px 16px; border-radius:12px;">Logout</button>
        </form>
      </li>
    `;
  } else {
    roleHtml = `<li><a class="nav-link-btn" href="/user/login">Client Portal</a></li>`;
    drawerRoleHtml = `<li><a class="drawer-link drawer-link-btn" href="/user/login">Client Portal</a></li>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Nikunj Pateliya</title>
  <meta name="description" content="${description}">
  <link rel="stylesheet" href="/assets/css/style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script>
    (function() {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.className = savedTheme + '-theme';
    })();
  </script>
</head>
<body id="page-top">
  <nav class="navbar" id="mainNav">
    <div class="nav-container">
      <a class="nav-brand" href="/">Nikunj.P</a>
      <ul class="nav-menu">
        <li><a class="nav-link" href="/#home">Home</a></li>
        <li><a class="nav-link" href="/#about">About</a></li>
        <li><a class="nav-link" href="/#services">Services</a></li>
        <li><a class="nav-link" href="/#portfolio">Projects Done</a></li>
        <li><a class="nav-link" href="/#testimonials">Testimonials</a></li>
        <li><a class="nav-link" href="/#blog">Blog</a></li>
        <li><a class="nav-link" href="/user/login">Contact</a></li>
        ${roleHtml}
      </ul>
      <div class="nav-actions">
        <button id="theme-toggle" class="btn-theme" aria-label="Toggle visual theme">Theme</button>
        <button id="navToggle" class="nav-toggle-btn" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobileDrawer">
          <span class="hamburger-icon">
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
          </span>
        </button>
      </div>
    </div>
  </nav>

  <div id="navBackdrop" class="nav-drawer-backdrop"></div>
  <aside id="mobileDrawer" class="nav-drawer" aria-hidden="true">
    <div class="drawer-header">
      <a class="nav-brand" href="/">Nikunj.P</a>
      <button id="drawerClose" class="drawer-close-btn" aria-label="Close navigation menu">&times;</button>
    </div>
    <ul class="drawer-menu">
      <li><a class="drawer-link" href="/#home">Home</a></li>
      <li><a class="drawer-link" href="/#about">About</a></li>
      <li><a class="drawer-link" href="/#services">Services</a></li>
      <li><a class="drawer-link" href="/#portfolio">Projects Done</a></li>
      <li><a class="drawer-link" href="/#testimonials">Testimonials</a></li>
      <li><a class="drawer-link" href="/#blog">Blog</a></li>
      <li><a class="drawer-link" href="/user/login">Contact</a></li>
      ${drawerRoleHtml}
    </ul>
    <div class="drawer-footer">
      <button id="drawer-theme-toggle" class="btn-theme drawer-theme-btn" aria-label="Toggle visual theme">Theme</button>
    </div>
  </aside>
  
  <main id="main-scroll-container" data-scroll-container>
    ${content}
  </main>
  
  <div class="transition-curtain"></div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <script src="/assets/js/main.js"></script>
</body>
</html>`;
}

export function homePage(data: { projects: any[]; skills: any[]; services: any[]; blogPosts: any[] }, role?: 'admin' | 'user'): string {
  // Built-in SVG Icons for services to keep pages extremely fast (YAGNI/ponytail: zero resource file loading)
  const icons = {
    web: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
    responsive: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`,
    creative: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 1 8 4.5l-2.5 2.5a6 6 0 1 0-11 0L4 6.5A10 10 0 0 1 12 2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    support: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
    idea: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5.5 5.5 0 0 0 7.5 5C6 6.3 5.5 7.6 5.5 9c0 1.3.5 2.6 1.5 3.5.7.8 1.3 1.5 1.5 2.5"></path><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line></svg>`,
    design: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"></path><path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"></path></svg>`
  };

  const services = [
    { title: 'Web Development', desc: 'Crafting responsive, high-performance web applications using modern, compile-free server technologies.', icon: icons.web },
    { title: 'Responsive Design', desc: 'Ensuring your site behaves perfectly across all viewports, from compact devices to ultrawide displays.', icon: icons.responsive },
    { title: 'Creative Layouts', desc: 'Bespoke design concepts featuring modular bento structures and custom visual typography.', icon: icons.creative },
    { title: 'Edge Analytics', desc: 'Implementing fast, serverless endpoints optimized for minimal load times and zero framework overhead.', icon: icons.support },
    { title: 'SEO & Dynamic Sitemaps', desc: 'Deploying structured meta schemas and automatic XML sitemaps to optimize search engine crawling.', icon: icons.idea },
    { title: 'UI/UX Strategy', desc: 'Developing intuitive navigational frameworks, hover transitions, and accessible visual flows.', icon: icons.design }
  ];

  const portfolioItems = [
    { title: 'Corporate Portal', cat: 'Web Development', class: 'gal_a', img: '/assets/images/uploads/gallery_img-01.jpg' },
    { title: 'Creative Layout', cat: 'Creative Design', class: 'gal_b', img: '/assets/images/uploads/gallery_img-02.jpg' },
    { title: 'Brand Identity', cat: 'Graphic Design', class: 'gal_c', img: '/assets/images/uploads/gallery_img-03.jpg' },
    { title: 'SaaS Dashboard', cat: 'Web Development', class: 'gal_a', img: '/assets/images/uploads/gallery_img-04.jpg' },
    { title: 'E-commerce App', cat: 'Web Development', class: 'gal_a', img: '/assets/images/uploads/gallery_img-05.jpg' },
    { title: 'Digital Agency', cat: 'Creative Design', class: 'gal_b', img: '/assets/images/uploads/gallery_img-06.jpg' }
  ];

  const portfolioHtml = portfolioItems.map(p => `
    <div class="glass gallery-item ${p.class}" data-scroll>
      <div class="gallery-image-wrapper">
        <img src="${p.img}" alt="${p.title}" class="gallery-image">
      </div>
      <div class="gallery-info">
        <h4>${p.title}</h4>
        <span class="gallery-category">${p.cat}</span>
      </div>
    </div>
  `).join('');

  const servicesHtml = services.map(s => `
    <div class="glass service-card" data-scroll>
      <div class="service-icon-box">
        ${s.icon}
      </div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
    </div>
  `).join('');

  const testimonials = [
    { name: 'James Fernando', role: 'Manager of Racer', text: 'Wonderful Support! They delivered our project on time with an incredibly skilled, professional team.', img: '/assets/images/uploads/testi_01.png' },
    { name: 'Jacques Philips', role: 'Designer', text: 'Awesome Services! Their attention to page speed and custom styling exceeds standard templates.', img: '/assets/images/uploads/testi_02.png' },
    { name: 'Venanda Mercy', role: 'New York City', text: 'Great & Talented Team! Clean layouts, high performance, and smooth animations. Highly recommended.', img: '/assets/images/uploads/testi_03.png' }
  ];

  const testimonialsHtml = testimonials.map(t => `
    <div class="glass testimonial-card" data-scroll>
      <div class="testimonial-header">
        <img src="${t.img}" alt="${t.name}" class="testimonial-avatar">
        <div class="testimonial-meta">
          <h4>${t.name}</h4>
          <span class="text-muted">${t.role}</span>
        </div>
      </div>
      <p class="testimonial-text">"${t.text}"</p>
    </div>
  `).join('');

  const blogHtml = data.blogPosts.length
    ? data.blogPosts.map(p => `
      <article class="glass blog-card" data-scroll>
        <h3><a href="/blog/${p.slug}">${p.title}</a></h3>
        <span class="text-muted">${new Date(p.created_at).toLocaleDateString()}</span>
      </article>
    `).join('')
    : `
      <div class="glass blog-card" data-scroll>
        <h3>Custom SEO Architectures</h3>
        <span class="text-muted">August 12, 2026</span>
        <p class="text-secondary">Deploying dynamic sitemaps at the edge with zero static building steps.</p>
      </div>
      <div class="glass blog-card" data-scroll>
        <h3>Optimizing Web Core Vitals</h3>
        <span class="text-muted">August 10, 2026</span>
        <p class="text-secondary">Bypassing heavy client libraries and optimizing images to achieve high lighthouse scores.</p>
      </div>
    `;

  const content = `
    <section id="home" class="main-banner" style="background-image: url('/assets/images/uploads/hero-image.jpg');" data-scroll-section>
      <div class="heading">
        <span class="banner-greeting">HELLO, I'M</span>
        <h1 class="hero-title">Nikunj Pateliya</h1>
        <h3 class="cd-headline">
          <span class="typewriter-text" data-words='["Web Designer", "Full-Stack Developer", "Creative Concept Architect"]'>Web Designer</span>
        </h3>
        <div class="hero-actions">
          <a href="#about" class="btn">Learn More</a>
          <a href="#portfolio" class="btn-outline">View Projects Done</a>
        </div>
      </div>
    </section>


    <section id="about" class="section-container" data-scroll-section>
      <div class="about-row">
        <div class="about-col text-col" data-scroll>
          <span class="section-tag">INTRODUCTION</span>
          <h2 class="section-heading">About Nikunj Pateliya</h2>
          <p>I am a Gujarat-based Web Designer and Full-Stack Developer specializing in high-performance edge computing architectures, responsive styling, and modular layouts.</p>
          <p>By leveraging Cloudflare Workers, Hono, and D1 SQLite databases, I construct dynamic applications that run near-instantly at the edge, bypassing bulk frameworks and heavy client dependencies.</p>
          <a href="/assets/Nikunjkumar_Pateliya_CV.pdf" class="btn" style="margin-top: 1.5rem;" target="_blank" download>Download CV</a>
        </div>
        <div class="about-col image-col" data-scroll>
          <div class="profile-image-wrapper glass">
            <img src="/assets/images/uploads/about.jpeg" alt="Nikunj Pateliya" class="profile-image">
          </div>
        </div>
      </div>
    </section>

    <section id="services" class="section-container" data-scroll-section>
      <div class="section-header">
        <span class="section-tag">CAPABILITIES</span>
        <h2 class="section-heading">Services Offered</h2>
      </div>
      <div class="services-grid">
        ${servicesHtml}
      </div>
    </section>

    <section id="portfolio" class="section-container" data-scroll-section>
      <div class="section-header">
        <span class="section-tag">GALLERY</span>
        <h2 class="section-heading">Projects Done</h2>
        <div class="gallery-menu">
          <button class="active filter-btn" data-filter="all">All</button>
          <button class="filter-btn" data-filter="gal_a">Web Development</button>
          <button class="filter-btn" data-filter="gal_b">Creative Design</button>
          <button class="filter-btn" data-filter="gal_c">Graphic Design</button>
        </div>
      </div>
      <div class="gallery-list">
        ${portfolioHtml}
      </div>
    </section>

    <section id="testimonials" class="section-container" data-scroll-section>
      <div class="section-header">
        <span class="section-tag">FEEDBACK</span>
        <h2 class="section-heading">Testimonials</h2>
      </div>
      <div class="testimonials-grid">
        ${testimonialsHtml}
      </div>
    </section>

    <section id="blog" class="section-container" data-scroll-section>
      <div class="section-header">
        <span class="section-tag">ARTICLES</span>
        <h2 class="section-heading">Blog & Writing</h2>
      </div>
      <div class="blog-grid">
        ${blogHtml}
      </div>
    </section>

    <section id="contact" class="section-container" data-scroll-section>
      <div class="section-header" style="text-align: center;">
        <span class="section-tag">LET'S TALK</span>
        <h2 class="section-heading">Contact Us</h2>
      </div>
      <form action="/contact" method="POST" class="glass contact-form" data-scroll>
        <div class="form-row">
          <input type="text" name="name" placeholder="Your Name" required class="form-input">
          <input type="email" name="email" placeholder="Your Email" required class="form-input">
        </div>
        <input type="tel" name="phone" placeholder="Your Phone Number" class="form-input">
        <textarea name="message" placeholder="Your Message" required class="form-textarea"></textarea>
        <button type="submit" class="btn" style="align-self: center;">Send Message</button>
      </form>
    </section>

    <footer class="copyrights" data-scroll-section>
      <div class="footer-container">
        <p>&copy; 2026 Nikunj Pateliya. All Rights Reserved.</p>
        <div class="footer-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#portfolio">Projects Done</a>
          <a href="/user/login">Contact</a>
        </div>
      </div>
    </footer>
  `;

  return layout("Web Designer & Developer", content, "Portfolio of Nikunj Pateliya", role);
}

export function loginPage(role: 'admin' | 'user', error?: string): string {
  const title = role === 'admin' ? 'Admin Portal' : 'Client Login';
  const action = role === 'admin' ? '/admin/login' : '/user/login';
  
  const content = `
    <section class="auth-section">
      <div class="glass auth-card">
        <h2>${title}</h2>
        ${error ? `<div class="auth-error">${error}</div>` : ''}
        <form action="${action}" method="POST" class="auth-form">
          <input type="email" name="email" placeholder="Email Address" required class="form-input">
          <input type="password" name="password" placeholder="Password" required class="form-input">
          <button type="submit" class="btn">Sign In</button>
        </form>
        ${role === 'user' ? `<p class="auth-footer">New here? <a href="/user/register">Register account</a></p>` : ''}
      </div>
    </section>
  `;
  return layout(title, content);
}

export function registerPage(error?: string): string {
  const content = `
    <section class="auth-section">
      <div class="glass auth-card">
        <h2>Create Account</h2>
        ${error ? `<div class="auth-error">${error}</div>` : ''}
        <form action="/user/register" method="POST" class="auth-form">
          <input type="email" name="email" placeholder="Email Address" required class="form-input">
          <input type="password" name="password" placeholder="Password" required class="form-input">
          <button type="submit" class="btn">Register</button>
        </form>
        <p class="auth-footer">Already have an account? <a href="/user/login">Login here</a></p>
      </div>
    </section>
  `;
  return layout("Register", content);
}

export function adminMenuPage(
  users: any[], 
  messages: any[], 
  projects: any[] = [], 
  clientAssets: any[] = [],
  error?: string,
  success?: string,
  extra?: {
    allProjects?: any[];
    allBlogs?: any[];
    allServices?: any[];
    metadata?: any;
  }
): string {
  const usersHtml = users.map(u => `
    <tr>
      <td>${u.email}</td>
      <td><span class="role-badge role-${u.role}">${u.role}</span></td>
      <td>
        <form action="/admin/menu/users/delete" method="POST" style="display:inline; margin:0;">
          <input type="hidden" name="id" value="${u.id}">
          <button type="submit" class="btn-delete" onclick="return confirm('Delete user?')">Delete</button>
        </form>
      </td>
    </tr>
  `).join('');

  const messagesHtml = messages.map(m => `
    <div class="glass message-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; gap: 0.5rem;">
        <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700;">${m.subject}</h4>
        <span class="status-badge" style="font-size:0.7rem; padding: 2px 8px; background: rgba(255,255,255,0.05); color: var(--text-primary);">${m.status}</span>
      </div>
      <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${m.body}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-glass); padding-top: 0.5rem; margin-top: 0.5rem;">
        <small class="text-muted">${new Date(m.created_at).toLocaleString()}</small>
        <form action="/admin/menu/messages/delete" method="POST" style="margin:0;">
          <input type="hidden" name="id" value="${m.id}">
          <button type="submit" class="btn-delete" style="padding: 2px 8px; font-size: 0.75rem;" onclick="return confirm('Delete message?')">Delete</button>
        </form>
      </div>
    </div>
  `).join('');

  const projectsOptionsHtml = projects.map(p => `
    <option value="${p.id}">${p.title} (${p.client_email})</option>
  `).join('');

  const projectsHtml = projects.map(p => `
    <div class="glass message-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; gap: 0.5rem;">
        <h4 style="margin:0; font-weight: 700;">${p.title}</h4>
        <span class="status-badge status-${p.status}" style="font-size:0.7rem; padding: 2px 8px;">${p.status}</span>
      </div>
      <small style="display:block; margin-bottom:0.5rem;" class="text-muted">Client: <strong>${p.client_email}</strong></small>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap; font-size:0.75rem; margin-bottom:0.5rem;">
        ${p.figma_link ? `<a href="${p.figma_link}" target="_blank" style="color:var(--accent-color);">Figma</a>` : ''}
        ${p.staging_link ? `<a href="${p.staging_link}" target="_blank" style="color:var(--accent-color);">Staging</a>` : ''}
        ${p.production_link ? `<a href="${p.production_link}" target="_blank" style="color:var(--accent-color);">Production</a>` : ''}
      </div>
      <div style="border-top:1px solid var(--border-glass); padding-top:0.5rem; display:flex; justify-content:space-between; align-items:center;">
        <small class="text-muted">Created: ${new Date(p.created_at).toLocaleDateString()}</small>
        <form action="/admin/client/delete" method="POST" style="margin:0;">
          <input type="hidden" name="id" value="${p.id}">
          <button type="submit" class="btn-delete" style="padding: 2px 8px; font-size:0.75rem;" onclick="return confirm('Delete client portal and all milestone/invoices? This deletes the client user too.')">Delete Portal</button>
        </form>
      </div>
    </div>
  `).join('');

  const clientAssetsHtml = clientAssets.map(a => `
    <div class="glass message-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; gap: 0.5rem;">
        <h4 style="margin: 0; font-size: 1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><a href="${a.file_url}" target="_blank" download style="color:var(--accent-color); font-weight:600;">${a.file_name}</a></h4>
        <span class="role-badge role-user" style="font-size:0.65rem; padding: 2px 8px;">${a.category}</span>
      </div>
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">${a.description || 'No description notes.'}</p>
      <small style="display:block; margin-bottom:0.5rem;" class="text-muted">Client: <strong>${a.client_email}</strong></small>
      <small class="text-muted" style="font-size: 0.75rem;">Uploaded: ${new Date(a.created_at).toLocaleString()}</small>
    </div>
  `).join('');

  const allProjects = extra?.allProjects || [];
  const allBlogs = extra?.allBlogs || [];
  const allServices = extra?.allServices || [];
  const metadata = extra?.metadata || {};

  const servicesListHtml = allServices.map(s => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: rgba(255, 255, 255, 0.03); border-radius: 6px; gap: 1rem; margin-bottom: 0.5rem;">
      <div style="flex: 1; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        <strong>${s.title}</strong>
        <span style="font-size: 0.75rem; color: var(--text-secondary); display: block; overflow: hidden; text-overflow: ellipsis;">${s.description}</span>
      </div>
      <form action="/admin/service/delete" method="POST" style="margin:0; flex-shrink:0;">
        <input type="hidden" name="id" value="${s.id}">
        <button type="submit" class="btn-delete" style="padding: 3px 6px; font-size: 0.7rem;" onclick="return confirm('Delete service ${s.title}?')">Delete</button>
      </form>
    </div>
  `).join('');

  const projectsListHtml = allProjects.map(p => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: rgba(255, 255, 255, 0.03); border-radius: 6px; gap: 1rem; margin-bottom: 0.5rem;">
      <div style="flex: 1; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        <strong>${p.title}</strong>
        <span class="role-badge role-user" style="font-size:0.65rem; padding: 1px 6px;">${p.category || 'Portfolio'}</span>
      </div>
      <form action="/admin/content/delete" method="POST" style="margin:0; flex-shrink:0;">
        <input type="hidden" name="id" value="${p.id}">
        <button type="submit" class="btn-delete" style="padding: 3px 6px; font-size: 0.7rem;" onclick="return confirm('Delete project ${p.title}?')">Delete</button>
      </form>
    </div>
  `).join('');

  const blogsListHtml = allBlogs.map(b => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: rgba(255, 255, 255, 0.03); border-radius: 6px; gap: 1rem; margin-bottom: 0.5rem;">
      <div style="flex: 1; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        <strong>${b.title}</strong>
        <span class="role-badge role-admin" style="font-size:0.65rem; padding: 1px 6px;">/blog/${b.slug}</span>
      </div>
      <form action="/admin/content/delete" method="POST" style="margin:0; flex-shrink:0;">
        <input type="hidden" name="id" value="${b.id}">
        <button type="submit" class="btn-delete" style="padding: 3px 6px; font-size: 0.7rem;" onclick="return confirm('Delete blog ${b.title}?')">Delete</button>
      </form>
    </div>
  `).join('');

  const content = `
    <style>
      .admin-dashboard {
        padding: 120px 24px 60px;
        max-width: 1400px;
        margin: 0 auto;
      }
      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .admin-flex {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .admin-forms-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
        gap: 1.5rem;
      }
      .admin-form-card {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        border-radius: 12px;
      }
      .status-onboarding { background: #3B82F6; color: white; }
      .status-wireframing { background: #8B5CF6; color: white; }
      .status-development { background: #F59E0B; color: white; }
      .status-testing { background: #EC4899; color: white; }
      .status-completed { background: #10B981; color: white; }
      
      .alert-banner {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-weight: 600;
      }
      .alert-success { background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }
      .alert-error { background: rgba(239, 68, 68, 0.15); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.3); }
    </style>

    <div class="admin-dashboard">
      <header class="dashboard-header">
        <h2>Admin Management Portal</h2>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <a href="/admin/data" class="btn">Data Access</a>
          <form action="/admin/logout" method="POST" style="margin:0;">
            <button type="submit" class="btn-outline">Logout</button>
          </form>
        </div>
      </header>

      ${error ? `<div class="alert-banner alert-error">${error}</div>` : ''}
      ${success ? `<div class="alert-banner alert-success">${success}</div>` : ''}
      
      <div class="admin-flex">
        <section class="dashboard-col glass" style="padding: 1.5rem; border-radius:12px;">
          <h3 style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-glass); padding-bottom: 0.5rem;">Client Portal Creator</h3>
          <div class="admin-forms-grid">
            
            <div class="admin-form-card glass" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding: 2rem;">
              <h4 style="color: var(--accent-color); margin-bottom: 1rem;">1. Clients Proposal Reviewer</h4>
              <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">Review and approve incoming client project proposals to automatically create their projects.</p>
              <a href="/admin/proposals" class="btn">Open Proposals Reviewer</a>
            </div>

            <form action="/admin/milestone/create" method="POST" class="admin-form-card glass">
              <h4 style="color: var(--accent-color); margin:0;">2. Add Milestone</h4>
              <select name="project_id" required class="form-input" style="background:var(--bg-secondary); color:var(--text-primary); border: 1px solid var(--border-glass);">
                <option value="" disabled selected>Select Client Project</option>
                ${projectsOptionsHtml}
              </select>
              <input type="text" name="title" placeholder="Milestone Title (e.g. Deliver Wireframes)" required class="form-input">
              <textarea name="description" placeholder="Milestone Description" class="form-textarea" style="height:70px;"></textarea>
              <input type="date" name="due_date" required class="form-input">
              <select name="status" class="form-input" style="background:var(--bg-secondary); color:var(--text-primary); border: 1px solid var(--border-glass);">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button type="submit" class="btn">Add Milestone</button>
            </form>

            <form action="/admin/invoice/create" method="POST" class="admin-form-card glass">
              <h4 style="color: var(--accent-color); margin:0;">3. Add Invoice</h4>
              <select name="project_id" required class="form-input" style="background:var(--bg-secondary); color:var(--text-primary); border: 1px solid var(--border-glass);">
                <option value="" disabled selected>Select Client Project</option>
                ${projectsOptionsHtml}
              </select>
              <input type="text" name="invoice_number" placeholder="Invoice # (e.g. INV-001)" required class="form-input">
              <input type="number" step="0.01" name="amount" placeholder="Amount (e.g. 1500.00)" required class="form-input">
              <input type="date" name="due_date" required class="form-input">
              <input type="url" name="payment_url" placeholder="Stripe/Payment URL (Optional)" class="form-input">
              <select name="status" class="form-input" style="background:var(--bg-secondary); color:var(--text-primary); border: 1px solid var(--border-glass);">
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
              <button type="submit" class="btn">Add Invoice</button>
            </form>

          </div>
        </section>

        <div class="dashboard-grid">
          <section class="dashboard-col glass" style="border-radius:12px;">
            <h3>Active Client Projects</h3>
            <div class="messages-list" style="max-height:400px; overflow-y:auto; padding-right:5px;">
              ${projectsHtml.length ? projectsHtml : '<p class="text-secondary">No client projects created yet.</p>'}
            </div>
          </section>

          <section class="dashboard-col glass" style="border-radius:12px;">
            <h3>Client Uploads & Briefs</h3>
            <div class="messages-list" style="max-height:400px; overflow-y:auto; padding-right:5px;">
              ${clientAssetsHtml.length ? clientAssetsHtml : '<p class="text-secondary">No files uploaded by clients yet.</p>'}
            </div>
          </section>
        </div>

        <div class="dashboard-grid">
          <section class="dashboard-col glass" style="border-radius:12px;">
            <h3>Registered System Users</h3>
            <div class="table-responsive">
              <table class="users-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${usersHtml}
                </tbody>
              </table>
            </div>
          </section>

          <section class="dashboard-col glass" style="border-radius:12px;">
            <h3>Visitor Messages</h3>
            <div class="messages-list" style="max-height:400px; overflow-y:auto; padding-right:5px;">
              ${messagesHtml.length ? messagesHtml : '<p class="text-secondary">No messages yet.</p>'}
            </div>
          </section>
        </div>

        <div class="admin-sections-manager" style="margin-top: 2rem; grid-column: 1/-1;">
          <h3 style="border-bottom: 1px solid var(--border-glass); padding-bottom: 0.5rem; margin-bottom: 1.5rem; font-weight:700;">Website Sections & Content Manager</h3>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 2rem; align-items: start;">
            
            <!-- 1. Manage About -->
            <form action="/admin/about/update" method="POST" class="admin-form-card glass" style="padding: 1.5rem; border-radius: 12px; gap: 1rem;">
              <h4 style="color: var(--accent-color); margin:0; font-weight:700;">About Section Bio</h4>
              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:0.25rem;">Intro Bio Paragraph 1</label>
                <textarea name="about_bio_1" class="form-textarea" style="height:80px; width:100%;" required>${metadata.about_bio_1 || ''}</textarea>
              </div>
              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:0.25rem;">Detail Bio Paragraph 2</label>
                <textarea name="about_bio_2" class="form-textarea" style="height:80px; width:100%;" required>${metadata.about_bio_2 || ''}</textarea>
              </div>
              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:0.25rem;">Profile Image File Path</label>
                <input type="text" name="about_profile_image" value="${metadata.about_profile_image || ''}" required class="form-input">
              </div>
              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:0.25rem;">Download CV File Path</label>
                <input type="text" name="about_cv_url" value="${metadata.about_cv_url || ''}" required class="form-input">
              </div>
              <button type="submit" class="btn">Update About Section</button>
            </form>

            <!-- 2. Manage Services -->
            <div class="glass" style="padding: 1.5rem; border-radius: 12px;">
              <h4 style="color: var(--accent-color); margin: 0 0 1rem 0; font-weight:700;">Services Offered</h4>
              <form action="/admin/service/create" method="POST" class="admin-form-card" style="padding:0; background:none; border:none; box-shadow:none; gap:0.8rem; margin-bottom:1.5rem;">
                <input type="text" name="title" placeholder="Service Title (e.g. Web Design)" required class="form-input">
                <textarea name="description" placeholder="Service Description" class="form-textarea" style="height:60px;" required></textarea>
                <textarea name="icon" placeholder="Icon SVG (e.g. <svg>...</svg>)" class="form-textarea" style="height:60px;" required></textarea>
                <button type="submit" class="btn">Add New Service</button>
              </form>
              <div style="border-top:1px solid var(--border-glass); padding-top:1rem; max-height:220px; overflow-y:auto;">
                <h5 style="margin-top:0; margin-bottom:0.75rem;">Active Services:</h5>
                ${servicesListHtml.length ? servicesListHtml : '<p class="text-secondary">No custom services added.</p>'}
              </div>
            </div>

            <!-- 3. Manage Projects Done -->
            <div class="glass" style="padding: 1.5rem; border-radius: 12px;">
              <h4 style="color: var(--accent-color); margin: 0 0 1rem 0; font-weight:700;">Projects Done (Portfolio)</h4>
              <form action="/admin/content/create" method="POST" class="admin-form-card" style="padding:0; background:none; border:none; box-shadow:none; gap:0.8rem; margin-bottom:1.5rem;">
                <input type="hidden" name="type" value="project">
                <input type="text" name="title" placeholder="Project Title" required class="form-input">
                <input type="text" name="category" placeholder="Category (e.g. Web Development)" required class="form-input">
                <select name="class_name" required class="form-input" style="background:var(--bg-secondary); color:var(--text-primary); border: 1px solid var(--border-glass);">
                  <option value="gal_a">Web Development (gal_a)</option>
                  <option value="gal_b">Creative Design (gal_b)</option>
                  <option value="gal_c">Graphic Design (gal_c)</option>
                </select>
                <input type="text" name="image_url" placeholder="Image File Path" required class="form-input">
                <textarea name="content" placeholder="Project Details / Description..." class="form-textarea" style="height:60px;" required></textarea>
                <button type="submit" class="btn">Add Project Entry</button>
              </form>
              <div style="border-top:1px solid var(--border-glass); padding-top:1rem; max-height:220px; overflow-y:auto;">
                <h5 style="margin-top:0; margin-bottom:0.75rem;">Active Projects:</h5>
                ${projectsListHtml.length ? projectsListHtml : '<p class="text-secondary">No custom projects added.</p>'}
              </div>
            </div>

            <!-- 4. Manage Blogs -->
            <div class="glass" style="padding: 1.5rem; border-radius: 12px;">
              <h4 style="color: var(--accent-color); margin: 0 0 1rem 0; font-weight:700;">Blog Articles</h4>
              <form action="/admin/content/create" method="POST" class="admin-form-card" style="padding:0; background:none; border:none; box-shadow:none; gap:0.8rem; margin-bottom:1.5rem;">
                <input type="hidden" name="type" value="blog">
                <input type="text" name="title" placeholder="Article Title" required class="form-input">
                <input type="text" name="slug" placeholder="Article Slug (e.g. core-vitals)" required class="form-input">
                <textarea name="content" placeholder="Article Body Content..." class="form-textarea" style="height:60px;" required></textarea>
                <button type="submit" class="btn">Publish Blog Article</button>
              </form>
              <div style="border-top:1px solid var(--border-glass); padding-top:1rem; max-height:220px; overflow-y:auto;">
                <h5 style="margin-top:0; margin-bottom:0.75rem;">Published Articles:</h5>
                ${blogsListHtml.length ? blogsListHtml : '<p class="text-secondary">No blog articles published.</p>'}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  `;
  return layout("Admin Menu", content, "Admin Control Panel", "admin");
}

export function adminDataPage(blogPosts: any[], siteConfig: any[]): string {
  const blogsHtml = blogPosts.map(p => `
    <tr>
      <td>${p.title}</td>
      <td>${p.slug}</td>
      <td><span class="role-badge ${p.is_published ? 'role-admin' : 'role-user'}">${p.is_published ? 'Published' : 'Draft (Project)'}</span></td>
      <td>${new Date(p.created_at).toLocaleDateString()}</td>
    </tr>
  `).join('');

  const configHtml = siteConfig.map(c => `
    <tr>
      <td><code>${c.key}</code></td>
      <td>${c.value}</td>
    </tr>
  `).join('');

  const content = `
    <div class="admin-dashboard">
      <header class="dashboard-header">
        <h2>Admin Data Access</h2>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <a href="/admin/menu" class="btn-outline">Back to Dashboard</a>
          <form action="/admin/logout" method="POST" style="margin:0;">
            <button type="submit" class="btn-outline">Logout</button>
          </form>
        </div>
      </header>
      
      <div class="dashboard-grid">
        <section class="dashboard-col glass" style="flex: 2; border-radius:12px;">
          <h3>Content (Projects & Blog Posts)</h3>
          <div class="table-responsive">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                ${blogsHtml.length ? blogsHtml : '<tr><td colspan="4" class="text-center text-secondary">No content entries found.</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>

        <section class="dashboard-col glass" style="flex: 1; border-radius:12px;">
          <h3>Site Metadata</h3>
          <div class="table-responsive">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${configHtml.length ? configHtml : '<tr><td colspan="2" class="text-center text-secondary">No metadata found.</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  `;
  return layout("Data Access", content, "Site DB Data Access", "admin");
}

export function clientDashboardPage(data: {
  client: any;
  project: any;
  milestones: any[];
  invoices: any[];
  assets: any[];
  error?: string;
  success?: string;
}): string {
  const { client, project, milestones, invoices, assets, error, success } = data;

  if (!project) {
    const noProjectContent = `
      <section class="auth-section" style="padding-top: 120px;">
        <div class="glass auth-card" style="text-align: center; max-width: 600px; border-radius:12px;">
          <h2>Client Portal</h2>
          <p style="margin: 1.5rem 0; color: var(--text-secondary);">Your client portal has been registered (Email: <strong>${client.email}</strong>), but there are currently no active projects assigned to your account.</p>
          <p style="color: var(--text-muted);">Please contact Nikunj Pateliya to setup and activate your dashboard.</p>
          <a href="/" class="btn" style="margin-top: 1.5rem;">Back to Home</a>
        </div>
      </section>
    `;
    return layout("Client Portal", noProjectContent, "My Portal", "user");
  }

  const milestonesHtml = milestones.length
    ? milestones.map(m => {
        let statusClass = 'pending';
        let statusLabel = 'Pending';
        if (m.status === 'completed') {
          statusClass = 'completed';
          statusLabel = 'Completed';
        } else if (m.status === 'in_progress') {
          statusClass = 'in_progress';
          statusLabel = 'In Progress';
        }

        return `
          <div class="timeline-item ${statusClass}">
            <div class="timeline-content">
              <div class="timeline-header">
                <h4 style="margin:0; font-weight:700;">${m.title}</h4>
                <span class="status-badge status-${statusClass}" style="font-size:0.7rem; padding:2px 8px;">${statusLabel}</span>
              </div>
              <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:0.25rem; margin-top:0.25rem;">${m.description || ''}</p>
              ${m.due_date ? `<small style="color:var(--text-muted);">Due Date: ${new Date(m.due_date).toLocaleDateString()}</small>` : ''}
            </div>
          </div>
        `;
      }).join('')
    : '<p class="text-secondary">No project milestones scheduled yet.</p>';

  const invoicesHtml = invoices.length
    ? invoices.map(i => {
        let statusLabel = i.status.toUpperCase();
        let statusClass = `invoice-${i.status}`;

        return `
          <tr>
            <td><strong>${i.invoice_number}</strong></td>
            <td>$${parseFloat(i.amount).toFixed(2)}</td>
            <td>${i.due_date ? new Date(i.due_date).toLocaleDateString() : 'N/A'}</td>
            <td><span class="invoice-status ${statusClass}">${statusLabel}</span></td>
            <td>
              ${i.status !== 'paid' && i.payment_url 
                ? `<a href="${i.payment_url}" target="_blank" class="btn" style="padding: 4px 12px; font-size: 0.8rem;">Pay Invoice</a>`
                : i.status === 'paid' ? '<span style="color:#10B981; font-weight:600;">✓ Settled</span>' : 'Pending Link'}
            </td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="5" class="text-secondary" style="text-align:center;">No invoices billed yet.</td></tr>';

  const assetsHtml = assets.length
    ? assets.map(a => `
        <div class="glass asset-card" style="border: 1px solid var(--border-glass); border-radius: 8px; padding: 1rem; position: relative;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; gap:0.5rem;">
            <h4 style="margin:0; font-size:1.05rem;"><a href="${a.file_url}" target="_blank" download="${a.file_name}" style="color:var(--accent-color); font-weight:600;">${a.file_name}</a></h4>
            <span class="role-badge role-user" style="font-size:0.7rem; padding:2px 8px;">${a.category}</span>
          </div>
          <p style="font-size:0.85rem; color:var(--text-secondary); margin:0 0 0.5rem;">${a.description || 'No description notes added.'}</p>
          <small class="text-muted" style="font-size:0.75rem;">Uploaded on: ${new Date(a.created_at).toLocaleDateString()}</small>
        </div>
      `).join('')
    : '<p class="text-secondary" style="grid-column: 1/-1;">No files uploaded yet. Use the form below to upload your project assets.</p>';

  const content = `
    <style>
      .client-dashboard {
        padding: 120px 24px 60px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .client-welcome {
        margin-bottom: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .client-welcome h1 {
        font-size: clamp(1.75rem, 4vw, 2.5rem);
        font-weight: 800;
        margin-bottom: 0.5rem;
        letter-spacing: -0.02em;
        overflow-wrap: break-word;
      }
      .status-badge {
        display: inline-block;
        padding: 6px 16px;
        border-radius: 99px;
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .status-onboarding { background: #3B82F6; color: white; }
      .status-wireframing { background: #8B5CF6; color: white; }
      .status-development { background: #F59E0B; color: white; }
      .status-testing { background: #EC4899; color: white; }
      .status-completed { background: #10B981; color: white; }

      .dashboard-section {
        margin-bottom: 3rem;
      }
      .dashboard-section h2 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid var(--border-glass);
        padding-bottom: 0.5rem;
      }
      
      .resources-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
        gap: 1.5rem;
      }
      .resource-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        transition: var(--transition-smooth);
        text-decoration: none;
        color: inherit;
        border-radius: 12px;
      }
      .resource-card:hover {
        border-color: var(--border-glass-hover);
        transform: translateY(-2px);
      }
      .resource-icon-box {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(16, 185, 129, 0.1);
        border-radius: 8px;
        color: var(--accent-color);
        flex-shrink: 0;
      }
      .resource-info h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.1rem;
        font-weight: 700;
      }

      .timeline {
        position: relative;
        padding-left: 2rem;
      }
      .timeline::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 7px;
        width: 2px;
        background: var(--border-glass);
      }
      .timeline-item {
        position: relative;
        margin-bottom: 2rem;
      }
      .timeline-item::before {
        content: '';
        position: absolute;
        left: -2rem;
        top: 6px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--bg-primary);
        border: 3px solid var(--border-glass);
        transition: var(--transition-smooth);
        z-index: 2;
      }
      .timeline-item.completed::before {
        background: #10B981;
        border-color: #10B981;
      }
      .timeline-item.in_progress::before {
        background: #F59E0B;
        border-color: #F59E0B;
      }
      .timeline-item.pending::before {
        background: var(--text-muted);
        border-color: var(--border-glass);
      }
      .timeline-content {
        background: var(--bg-glass);
        border: 1px solid var(--border-glass);
        border-radius: 8px;
        padding: 1rem 1.5rem;
      }
      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .upload-form, .message-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 2rem;
        border-radius: 12px;
      }
      .alert-banner {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-weight: 600;
      }
      .alert-success { background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }
      .alert-error { background: rgba(239, 68, 68, 0.15); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.3); }

      .invoices-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
      }
      .invoices-table th, .invoices-table td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid var(--border-glass);
      }
      .invoice-status {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        padding: 2px 8px;
        border-radius: 4px;
      }
      .invoice-paid { background: rgba(16, 185, 129, 0.15); color: #10B981; }
      .invoice-unpaid { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
      .invoice-overdue { background: rgba(239, 68, 68, 0.15); color: #EF4444; }

      .asset-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
      }
      .asset-card {
        padding: 1rem;
        border: 1px solid var(--border-glass);
        border-radius: 8px;
      }
      .asset-card h4 {
        margin-bottom: 0.25rem;
      }
      
      .dashboard-grid-two {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: clamp(1rem, 2.5cqi, 2rem);
      }
      @media (max-width: 900px) {
        .dashboard-grid-two {
          grid-template-columns: 1fr;
        }
      }
    </style>

    <div class="client-dashboard">
      <div class="client-welcome">
        <div>
          <span class="text-muted" style="font-family: var(--font-mono); font-size: 0.9rem;">CLIENT PORTAL</span>
          <h1>Project: ${project.title}</h1>
          <p class="text-secondary">${project.description || 'Welcome to your project portal!'}</p>
        </div>
        <div>
          <span class="status-badge status-${project.status}">Status: ${project.status}</span>
        </div>
      </div>

      ${error ? `<div class="alert-banner alert-error">${error}</div>` : ''}
      ${success ? `<div class="alert-banner alert-success">${success}</div>` : ''}

      <section class="dashboard-section">
        <h2>Shared Resources</h2>
        <div class="resources-grid">
          ${project.figma_link ? `
            <a href="${project.figma_link}" target="_blank" class="glass resource-card">
              <div class="resource-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"></path><path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"></path></svg>
              </div>
              <div class="resource-info">
                <h3>Figma Wireframes & Design</h3>
                <span class="text-muted" style="font-size:0.85rem;">Click to view designs</span>
              </div>
            </a>
          ` : ''}
          ${project.staging_link ? `
            <a href="${project.staging_link}" target="_blank" class="glass resource-card">
              <div class="resource-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              </div>
              <div class="resource-info">
                <h3>Staging Live Preview</h3>
                <span class="text-muted" style="font-size:0.85rem;">Inspect coded interface</span>
              </div>
            </a>
          ` : ''}
          ${project.production_link ? `
            <a href="${project.production_link}" target="_blank" class="glass resource-card">
              <div class="resource-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              </div>
              <div class="resource-info">
                <h3>Production Launched Link</h3>
                <span class="text-muted" style="font-size:0.85rem;">Live website URL</span>
              </div>
            </a>
          ` : ''}
        </div>
      </section>

      <div class="dashboard-grid-two">
        <div>
          <section class="dashboard-section">
            <h2>Project Milestones & Timeline</h2>
            <div class="timeline">
              ${milestonesHtml}
            </div>
          </section>

          <section class="dashboard-section">
            <h2>Billing & Invoices</h2>
            <div class="glass" style="padding:1.5rem; border-radius:12px;">
              <div class="table-responsive">
                <table class="invoices-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoicesHtml}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <div>
          <section class="dashboard-section">
            <h2>Deliver Brand Assets & Notes</h2>
            
            <form action="/client/upload" method="POST" enctype="multipart/form-data" class="glass upload-form">
              <h4 style="margin:0; color:var(--accent-color);">Submit Assets or Credentials</h4>
              
              <select name="category" required class="form-input" style="background:var(--bg-secondary); color:var(--text-primary); border: 1px solid var(--border-glass);">
                <option value="Logo">Logo / Brand Identity</option>
                <option value="Content/Copy">Website Content / Copywriting</option>
                <option value="Credentials">Credentials / API Keys</option>
                <option value="Design References">Design References / Inspiration</option>
                <option value="Other" selected>Other Assets</option>
              </select>

              <textarea name="description" placeholder="Write any notes, instructions, credentials or text briefs here..." class="form-textarea" style="height:100px;" required></textarea>

              <div>
                <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem; font-weight:600;">Attach File (Max 10MB)</label>
                <input type="file" name="file" class="form-input" required style="padding:8px; background:var(--bg-secondary); border: 1px solid var(--border-glass);">
              </div>

              <button type="submit" class="btn">Upload Asset & Submit Details</button>
            </form>

            <div style="margin-top: 2rem;">
              <h3 style="font-size:1.2rem; margin-bottom:1rem;">Your Uploaded Files</h3>
              <div style="display:flex; flex-direction:column; gap:1rem;">
                ${assetsHtml}
              </div>
            </div>
          </section>

          <section class="dashboard-section" style="margin-top:2rem;">
            <h2>Need Support or Have Feedback?</h2>
            <form action="/client/message" method="POST" class="glass message-form">
              <input type="text" name="subject" placeholder="Subject / Query topic" required class="form-input">
              <textarea name="body" placeholder="Write your message or detailed feedback..." required class="form-textarea" style="height:100px;"></textarea>
              <button type="submit" class="btn">Send Support Message</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  `;
  return layout("Client Portal Dashboard", content, "My Portal", "user");
}

export function proposalRequestPage(): string {
  const content = `
    <div class="section-container" style="padding-top:120px;">
      <div class="bento-box">
        <h1 style="margin-bottom:1rem; font-size:clamp(1.5rem, 4vw, 2rem); letter-spacing:-0.03em; overflow-wrap:break-word;">Request a Project</h1>
        <p style="color:var(--text-secondary); margin-bottom:2rem;">Fill out the details below to submit a proposal. We will review it and get back to you shortly.</p>
        <form action="/api/proposals" method="POST" class="contact-form">
          <input type="text" name="title" placeholder="Project Title" required class="form-input">
          <textarea name="content_description" placeholder="Project Description & Content" required class="form-textarea" style="height:100px;"></textarea>
          <input type="number" name="budget" placeholder="Estimated Budget (USD)" class="form-input">
          <textarea name="tech_requirements" placeholder="Technical Requirements (Optional)" class="form-textarea" style="height:80px;"></textarea>
          <textarea name="design_requirements" placeholder="Design Requirements (Optional)" class="form-textarea" style="height:80px;"></textarea>
          <button type="submit" class="btn">Submit Proposal</button>
        </form>
      </div>
    </div>
  `;
  return layout("Request a Project", content, "Submit a project proposal", "user");
}

export function proposalListPage(proposals: any[], role: 'admin' | 'user'): string {
  const proposalsHtml = proposals.length > 0 
    ? proposals.map(p => `
      <div class="bento-box" style="margin-bottom:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
          <h3 style="margin:0; overflow-wrap:break-word;">${p.title}</h3>
          <span style="padding:4px 8px; border-radius:4px; font-size:0.8rem; background:var(--bg-card); border:1px solid var(--border-glass);">
            ${p.status.toUpperCase()}
          </span>
        </div>
        <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1rem;">
          Budget: $${p.budget || 'N/A'} | Created: ${new Date(p.created_at).toLocaleDateString()}
        </p>
        <a href="${role === 'admin' ? '/admin' : '/client'}/proposals/${p.id}" class="btn" style="display:inline-flex; font-size:0.85rem; padding:6px 12px; min-height:36px;">View Details</a>
      </div>
    `).join('')
    : '<p style="color:var(--text-secondary);">No proposals found.</p>';

  const content = `
    <div class="section-container" style="padding-top:120px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; flex-wrap:wrap; gap:1rem;">
        <h1 style="font-size:clamp(1.5rem, 4vw, 2rem); letter-spacing:-0.03em; overflow-wrap:break-word;">Project Proposals</h1>
        ${role === 'user' ? `<a href="/client/proposals/new" class="btn">Request Project</a>` : ''}
      </div>
      <div style="display:grid; gap:1rem;">
        ${proposalsHtml}
      </div>
    </div>
  `;
  return layout("Project Proposals", content, "Manage project proposals", role);
}

export function proposalDetailsPage(proposal: any, comments: any[], role: 'admin' | 'user'): string {
  const commentsHtml = comments.length > 0
    ? comments.map(c => `
      <div style="margin-bottom:1rem; padding:1rem; background:var(--bg-card); border-radius:8px; border:1px solid var(--border-glass); overflow-wrap:break-word;">
        <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.5rem;">
          <strong>User ID: ${c.user_id}</strong> on ${new Date(c.created_at).toLocaleString()}
        </div>
        <div>${c.comment}</div>
      </div>
    `).join('')
    : '<p style="color:var(--text-secondary);">No comments yet.</p>';

  const actionForm = role === 'admin' && proposal.status !== 'approved' && proposal.status !== 'rejected'
    ? `
      <div style="margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border-glass);">
        <form action="/api/proposals/${proposal.id}/approve" method="POST" style="display:inline;">
          <button type="submit" class="btn" style="background:#22c55e; color:white;">Approve Proposal</button>
        </form>
      </div>
    ` : '';

  const content = `
    <div class="section-container" style="padding-top:120px;">
      <a href="${role === 'admin' ? '/admin' : '/client'}/proposals" style="color:var(--text-secondary); text-decoration:none; display:inline-block; margin-bottom:1rem;">&larr; Back to Proposals</a>
      <div class="bento-box" style="margin-bottom:2rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
          <h1 style="font-size:clamp(1.5rem, 4vw, 2rem); margin:0; overflow-wrap:break-word;">${proposal.title}</h1>
          <span style="padding:4px 8px; border-radius:4px; font-size:0.8rem; background:var(--bg-card); border:1px solid var(--border-glass);">
            STATUS: ${proposal.status.toUpperCase()}
          </span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap:1rem; margin-bottom:1.5rem;">
          <div>
            <strong>Budget:</strong> $${proposal.budget || 'N/A'}
          </div>
          <div>
            <strong>Client ID:</strong> ${proposal.client_id}
          </div>
        </div>
        <div style="margin-bottom:1.5rem;">
          <strong>Description:</strong>
          <p style="color:var(--text-secondary); white-space:pre-wrap; overflow-wrap:break-word;">${proposal.content_description}</p>
        </div>
        <div style="margin-bottom:1.5rem;">
          <strong>Tech Requirements:</strong>
          <p style="color:var(--text-secondary); white-space:pre-wrap; overflow-wrap:break-word;">${proposal.tech_requirements || 'None'}</p>
        </div>
        <div style="margin-bottom:1.5rem;">
          <strong>Design Requirements:</strong>
          <p style="color:var(--text-secondary); white-space:pre-wrap; overflow-wrap:break-word;">${proposal.design_requirements || 'None'}</p>
        </div>
        ${actionForm}
      </div>

      <div class="bento-box">
        <h2 style="font-size:clamp(1.25rem, 3vw, 1.5rem); margin-bottom:1rem;">Negotiation / Comments</h2>
        <div style="margin-bottom:1.5rem;">
          ${commentsHtml}
        </div>
        <form action="/api/proposals/${proposal.id}/comments" method="POST" class="contact-form">
          <textarea name="comment" placeholder="Add a comment or ask for changes..." required class="form-textarea" style="height:80px;"></textarea>
          <button type="submit" class="btn">Post Comment</button>
        </form>
      </div>
    </div>
  `;
  return layout(proposal.title, content, "Proposal Details", role);
}
