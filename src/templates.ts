export function layout(title: string, content: string, description: string = "Portfolio of Nikunj Pateliya"): string {
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
      <a class="nav-brand" href="#page-top">Nikunj.P</a>
      <ul class="nav-menu">
        <li><a class="nav-link active" href="#home">Home</a></li>
        <li><a class="nav-link" href="#about">About</a></li>
        <li><a class="nav-link" href="#services">Services</a></li>
        <li><a class="nav-link" href="#portfolio">Portfolio</a></li>
        <li><a class="nav-link" href="#testimonials">Testimonials</a></li>
        <li><a class="nav-link" href="#blog">Blog</a></li>
        <li><a class="nav-link" href="#contact">Contact</a></li>
        <li><a class="nav-link-btn" href="/user/login">Client Portal</a></li>
      </ul>
    </div>
  </nav>

  <div class="theme-toggle-container">
    <button id="theme-toggle" class="btn-theme" aria-label="Toggle visual theme">Theme</button>
  </div>
  
  <main id="main-scroll-container" data-scroll-container>
    ${content}
  </main>
  
  <div class="transition-curtain"></div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <script src="https://unpkg.com/lenis@1.1.9/dist/lenis.min.js"></script>
  <script src="/assets/js/main.js"></script>
  <script>
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  </script>
  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>`;
}

export function homePage(data: { projects: any[]; skills: any[]; services: any[]; blogPosts: any[] }): string {
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
          <a href="#portfolio" class="btn-outline">View Portfolio</a>
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
        <h2 class="section-heading">My Portfolio</h2>
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
          <a href="#portfolio">Portfolio</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
    </footer>
  `;

  return layout("Web Designer & Developer", content);
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

export function adminMenuPage(users: any[], messages: any[], siteConfig: any[]): string {
  const usersHtml = users.map(u => `
    <tr>
      <td>${u.email}</td>
      <td><span class="role-badge role-${u.role}">${u.role}</span></td>
      <td>
        <form action="/admin/menu/users/delete" method="POST" style="display:inline;">
          <input type="hidden" name="id" value="${u.id}">
          <button type="submit" class="btn-delete" onclick="return confirm('Delete user?')">Delete</button>
        </form>
      </td>
    </tr>
  `).join('');

  const messagesHtml = messages.map(m => `
    <div class="glass message-card">
      <div class="message-header">
        <h4>User: ${m.email || 'Anonymous'}</h4>
        <span class="text-muted">${new Date(m.created_at).toLocaleString()}</span>
      </div>
      <p class="message-subject"><strong>Subject:</strong> ${m.subject}</p>
      <p class="message-body">${m.body}</p>
    </div>
  `).join('');

  const content = `
    <div class="admin-dashboard">
      <header class="dashboard-header">
        <h2>Admin Management Portal</h2>
        <form action="/admin/logout" method="POST">
          <button type="submit" class="btn-outline">Logout</button>
        </form>
      </header>
      
      <div class="dashboard-grid">
        <section class="dashboard-col glass">
          <h3>Registered System Users</h3>
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
        </section>

        <section class="dashboard-col glass">
          <h3>Visitor Messages</h3>
          <div class="messages-list">
            ${messagesHtml.length ? messagesHtml : '<p class="text-secondary">No messages yet.</p>'}
          </div>
        </section>
      </div>
    </div>
  `;
  return layout("Admin Menu", content);
}
