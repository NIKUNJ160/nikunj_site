
import { Hono } from 'hono';
import { env } from 'hono/adapter';
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
  adminMenuPage,
  adminDataPage
} from './templates';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
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
async function fetchPortfolioData(supabase: SupabaseClient) {
  try {
    const { data: projects } = await supabase.from('blog_posts').select('*').eq('is_published', 0);
    const { data: blogPosts } = await supabase.from('blog_posts').select('*').eq('is_published', 1);
    const skills = [
      { name: 'TypeScript' }, { name: 'JavaScript' }, { name: 'HTML/CSS' },
      { name: 'Hono' }, { name: 'Cloudflare Workers' }, { name: 'Supabase/PostgreSQL' }
    ];
    const services = [
      { title: 'Web Design', description: 'Clean, dual-theme layouts using modern glassmorphic principles.' },
      { title: 'Full-Stack Development', description: 'Edge-rendered Cloudflare Workers apps running with serverless databases.' },
      { title: 'SEO & Strategy', description: 'Optimized page speeds, semantic tags, and dynamic sitemaps.' }
    ];
    return { projects: projects || [], skills, services, blogPosts: blogPosts || [] };
  } catch {
    // If DB has not been initialized yet, return empty structures
    return { projects: [], skills: [], services: [], blogPosts: [] };
  }
}

/* --- Public / General Routes --- */

app.get('/', async (c) => {
  const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
  const data = await fetchPortfolioData(supabase);
  return c.html(homePage(data));
});

app.get('/api/portfolio-data', async (c) => {
  const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
  const data = await fetchPortfolioData(supabase);
  return c.json(data);
});

// Dynamic Sitemap Generation (Cached at Edge for 1 hour)
app.get('/sitemap.xml', async (c) => {
  let blogs: any[] = [];
  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data } = await supabase.from('blog_posts').select('slug, updated_at').eq('is_published', 1);
    blogs = data || [];
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
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    await supabase.from('messages').insert({
      subject: `Contact from ${name}`,
      body: `${message} (Reply to: ${email})`,
      status: 'new'
    });
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
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
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
  if (env<Bindings>(c).ALLOW_REGISTRATION === 'false') {
    return c.text('Registration is disabled in this environment.');
  }
  return c.html(registerPage());
});

app.post('/user/register', async (c) => {
  if (env<Bindings>(c).ALLOW_REGISTRATION === 'false') {
    return c.text('Registration is disabled.');
  }

  const body = await c.req.parseBody();
  const email = body.email as string;
  const password = body.password as string;

  try {
    const hashed = await hashPassword(password);
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { error } = await supabase.from('users').insert({
      email,
      password_hash: hashed,
      role: 'user'
    });
    if (error) throw new Error(error.message);

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
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: user } = await supabase.from('users').select('*').eq('email', email).eq('role', 'admin').single();
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
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: users } = await supabase.from('users').select('id, email, role');
    const { data: messages } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    return c.html(adminMenuPage(users || [], messages || [], []));
  } catch {
    return c.text('Admin menu loading failed. Please run database initializations.');
  }
});

app.get('/admin/data', adminAuthMiddleware, async (c) => {
  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: blogPosts } = await supabase.from('blog_posts').select('id, title, slug, is_published, created_at').order('created_at', { ascending: false });
    const { data: metadata } = await supabase.from('site_metadata').select('*');
    return c.html(adminDataPage(blogPosts || [], metadata || []));
  } catch {
    return c.text('Admin data loading failed. Please run database initializations.');
  }
});

app.post('/admin/menu/users/delete', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const id = body.id as string;
  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    await supabase.from('users').delete().eq('id', id).neq('role', 'admin');
  } catch {}
  return c.redirect('/admin/menu');
});

export default app;
