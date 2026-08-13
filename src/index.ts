/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { 
  verifyPassword, 
  hashPassword, 
  createSession, 
  verifySession 
} from './auth';
import { 
  homePage, 
  loginPage, 
  registerPage, 
  adminMenuPage 
} from './templates';

type Bindings = {
  DB: D1Database;
  JWT_SECRET_KEY?: string;
  ALLOW_REGISTRATION?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Simple fallback secret if environment variable is not defined
const getSecret = (env: Bindings) => env.JWT_SECRET_KEY || 'default-jwt-secret-key-fallback';

// Rate limiter / security header injection (ponytail: native hono middleware)
app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  await next();
});

// Helper: check if tables are ready, return safe fallbacks if empty
async function fetchPortfolioData(db: D1Database) {
  try {
    const projects = await db.prepare('SELECT * FROM blog_posts WHERE is_published = 0').all();
    const blogPosts = await db.prepare('SELECT * FROM blog_posts WHERE is_published = 1').all();
    const skills = [
      { name: 'TypeScript' }, { name: 'JavaScript' }, { name: 'HTML/CSS' },
      { name: 'Hono' }, { name: 'Cloudflare Workers' }, { name: 'SQLite/D1' }
    ];
    const services = [
      { title: 'Web Design', description: 'Clean, dual-theme layouts using modern glassmorphic principles.' },
      { title: 'Full-Stack Development', description: 'Edge-rendered Cloudflare Workers apps running with serverless databases.' },
      { title: 'SEO & Strategy', description: 'Optimized page speeds, semantic tags, and dynamic sitemaps.' }
    ];
    return { projects: projects.results || [], skills, services, blogPosts: blogPosts.results || [] };
  } catch {
    // If DB has not been initialized yet, return empty structures
    return { projects: [], skills: [], services: [], blogPosts: [] };
  }
}

/* --- Public / General Routes --- */

app.get('/', async (c) => {
  const data = await fetchPortfolioData(c.env.DB);
  return c.html(homePage(data));
});

app.get('/api/portfolio-data', async (c) => {
  const data = await fetchPortfolioData(c.env.DB);
  return c.json(data);
});

// Dynamic Sitemap Generation (Cached at Edge for 1 hour)
app.get('/sitemap.xml', async (c) => {
  let blogs: any[] = [];
  try {
    const res = await c.env.DB.prepare('SELECT slug, updated_at FROM blog_posts WHERE is_published = 1').all();
    blogs = res.results || [];
  } catch {}

  const host = c.req.header('host') || 'nikunjpateliya.com';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const urls = [
    { loc: `${baseUrl}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${baseUrl}/user/login`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${baseUrl}/admin/login`, changefreq: 'monthly', priority: '0.3' }
  ];

  blogs.forEach(b => {
    urls.push({
      loc: `${baseUrl}/blog/${b.slug}`,
      changefreq: 'monthly',
      priority: '0.8'
    });
  });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('')}
</urlset>`;

  c.header('Content-Type', 'application/xml');
  c.header('Cache-Control', 'public, max-age=3600');
  return c.text(sitemapXml.trim());
});

app.post('/contact', async (c) => {
  const body = await c.req.parseBody();
  const name = body.name as string;
  const email = body.email as string;
  const message = body.message as string;

  try {
    await c.env.DB.prepare(
      'INSERT INTO messages (subject, body, status) VALUES (?, ?, ?)'
    ).bind(`Contact from ${name}`, `${message} (Reply to: ${email})`, 'new').run();
  } catch {}

  return c.text('Thank you! Your message has been sent successfully. Go back to Home.');
});

/* --- User Authentication --- */

app.get('/user/login', (c) => {
  return c.html(loginPage('user'));
});

app.post('/user/login', async (c) => {
  const body = await c.req.parseBody();
  const email = body.email as string;
  const password = body.password as string;

  try {
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (user && await verifyPassword(password, user.password_hash as string)) {
      const token = await createSession(email, user.role as 'admin' | 'user', getSecret(c.env));
      setCookie(c, 'user_session', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 2 * 60 * 60 // 2 hours
      });
      return c.redirect('/');
    }
  } catch {}

  return c.html(loginPage('user', 'Invalid email or password.'));
});

app.get('/user/register', (c) => {
  if (c.env.ALLOW_REGISTRATION === 'false') {
    return c.text('Registration is disabled in this environment.');
  }
  return c.html(registerPage());
});

app.post('/user/register', async (c) => {
  if (c.env.ALLOW_REGISTRATION === 'false') {
    return c.text('Registration is disabled.');
  }

  const body = await c.req.parseBody();
  const email = body.email as string;
  const password = body.password as string;

  try {
    const hashed = await hashPassword(password);
    await c.env.DB.prepare(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)'
    ).bind(email, hashed, 'user').run();

    const token = await createSession(email, 'user', getSecret(c.env));
    setCookie(c, 'user_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 2 * 60 * 60
    });
    return c.redirect('/');
  } catch (err: any) {
    const errorMsg = err.message?.includes('UNIQUE') ? 'Email is already registered.' : 'Registration failed.';
    return c.html(registerPage(errorMsg));
  }
});

app.post('/user/logout', (c) => {
  deleteCookie(c, 'user_session');
  return c.redirect('/');
});

/* --- Admin Authentication --- */

app.get('/admin/login', (c) => {
  return c.html(loginPage('admin'));
});

app.post('/admin/login', async (c) => {
  const body = await c.req.parseBody();
  const email = body.email as string;
  const password = body.password as string;

  try {
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? AND role = "admin"').bind(email).first();
    if (user && await verifyPassword(password, user.password_hash as string)) {
      const token = await createSession(email, 'admin', getSecret(c.env));
      setCookie(c, 'admin_session', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 2 * 60 * 60
      });
      return c.redirect('/admin/menu');
    }
  } catch {}

  return c.html(loginPage('admin', 'Invalid admin credentials.'));
});

app.post('/admin/logout', (c) => {
  deleteCookie(c, 'admin_session');
  return c.redirect('/admin/login');
});

/* --- Protected Admin Panel --- */

const adminAuthMiddleware = async (c: any, next: any) => {
  const token = getCookie(c, 'admin_session');
  if (!token) return c.redirect('/admin/login');
  
  const session = await verifySession(token, getSecret(c.env));
  if (!session || session.role !== 'admin') {
    deleteCookie(c, 'admin_session');
    return c.redirect('/admin/login');
  }
  c.set('admin_user', session);
  await next();
};

app.get('/admin/menu', adminAuthMiddleware, async (c) => {
  try {
    const users = await c.env.DB.prepare('SELECT id, email, role FROM users').all();
    const messages = await c.env.DB.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
    return c.html(adminMenuPage(users.results || [], messages.results || [], []));
  } catch {
    return c.text('Admin menu loading failed. Please run database initializations.');
  }
});

app.post('/admin/menu/users/delete', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const id = body.id as string;
  try {
    await c.env.DB.prepare('DELETE FROM users WHERE id = ? AND role != "admin"').bind(id).run();
  } catch {}
  return c.redirect('/admin/menu');
});

export default app;
