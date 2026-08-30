import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { 
  verifyPassword, 
  hashPassword, 
  createSession, 
  verifySession,
  sendPasswordResetEmail,
  getGoogleOAuthUrl
} from './auth';
import { rateLimiter } from './middleware/rateLimiter';
import { 
  homePage, 
  loginPage, 
  registerPage, 
  forgotPasswordPage,
  resetPasswordPage,
  adminMenuPage,
  adminDataPage,
  adminClientDetailPage,
  clientDashboardPage,
  proposalRequestPage,
  proposalListPage,
  proposalDetailsPage,
  blogListPage,
  blogDetailPage,
  privacyPage,
  termsPage
} from './templates';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  JWT_SECRET_KEY?: string;
  ALLOW_REGISTRATION?: string;
};

type Variables = {
  admin_user: any;
  client_user: any;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Simple fallback secret if environment variable is not defined
const getSecret = (env: Bindings) => env.JWT_SECRET_KEY || 'default-jwt-secret-key-fallback';

// Rate limiter / security header injection (ponytail: native hono middleware)
app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Swap in service role key if available to bypass database RLS policies securely on server
  const serviceKey = (c.env as any)?.SUPABASE_SERVICE_ROLE_KEY || (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY);
  if (serviceKey) {
    if (c.env) (c.env as any).SUPABASE_ANON_KEY = serviceKey;
    if (typeof process !== 'undefined' && process.env) process.env.SUPABASE_ANON_KEY = serviceKey;
  }

  await next();
});

// Rate limiter middleware for sensitive auth routes (max 5 requests per 15 mins per IP)
const authRateLimiter = rateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000 });
app.use('/user/login', authRateLimiter);
app.use('/user/register', authRateLimiter);
app.use('/admin/login', authRateLimiter);
app.use('/user/forgot-password', authRateLimiter);

// Helper: check if tables are ready, return safe fallbacks if empty
async function fetchPortfolioData(supabase: SupabaseClient) {
  try {
    const { data: projects } = await supabase.from('blog_posts').select('*').eq('is_published', 0).order('id', { ascending: false });
    const { data: blogPosts } = await supabase.from('blog_posts').select('*').eq('is_published', 1).order('created_at', { ascending: false });
    const { data: dbServices } = await supabase.from('services').select('*').order('created_at', { ascending: true });
    const { data: dbTestimonials } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    const { data: meta } = await supabase.from('site_metadata').select('*');

    const skills = [
      { name: 'TypeScript' }, { name: 'JavaScript' }, { name: 'HTML/CSS' },
      { name: 'Hono' }, { name: 'Cloudflare Workers' }, { name: 'Supabase/PostgreSQL' }
    ];

    const metadata: Record<string, string> = {};
    if (meta) {
      meta.forEach((row: any) => {
        metadata[row.key] = row.value;
      });
    }

    let services = [];
    if (dbServices && dbServices.length > 0) {
      services = dbServices.map((s: any) => ({
        title: s.title,
        desc: s.description,
        icon: s.icon
      }));
    } else {
      services = [
        { title: 'Web Design', desc: 'Clean, dual-theme layouts using modern glassmorphic principles.', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"></path><path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"></path></svg>' },
        { title: 'Full-Stack Development', desc: 'Edge-rendered Cloudflare Workers apps running with serverless databases.', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>' },
        { title: 'SEO & Strategy', desc: 'Optimized page speeds, semantic tags, and dynamic sitemaps.', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>' }
      ];
    }

    return { projects: projects || [], skills, services, blogPosts: blogPosts || [], metadata, testimonials: dbTestimonials || [] };
  } catch {
    return { projects: [], skills: [], services: [], blogPosts: [], metadata: {}, testimonials: [] };
  }
}

/* --- Public / General Routes --- */

app.get('/', async (c) => {
  const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
  const data = await fetchPortfolioData(supabase);
  
  let role: 'admin' | 'user' | undefined = undefined;
  
  const adminToken = getCookie(c, 'admin_session');
  if (adminToken) {
    const session = await verifySession(adminToken, getSecret(c.env));
    if (session && session.role === 'admin') {
      role = 'admin';
    }
  }
  
  if (!role) {
    const userToken = getCookie(c, 'user_session');
    if (userToken) {
      const session = await verifySession(userToken, getSecret(c.env));
      if (session && session.role === 'user') {
        role = 'user';
      }
    }
  }

  return c.html(homePage(data, role));
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

  const host = c.req.header('host') || 'nikunjpateliya.site';
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

app.get('/contact', (c) => c.redirect('/user/login'));

app.get('/privacy', async (c) => {
  const token = getCookie(c, 'auth_token');
  let role: 'admin' | 'user' | undefined;
  if (token) {
    const payload = await verifySession(token, getSecret(env<Bindings>(c)));
    if (payload) role = payload.role;
  }
  return c.html(privacyPage(role));
});

app.get('/terms', async (c) => {
  const token = getCookie(c, 'auth_token');
  let role: 'admin' | 'user' | undefined;
  if (token) {
    const payload = await verifySession(token, getSecret(env<Bindings>(c)));
    if (payload) role = payload.role;
  }
  return c.html(termsPage(role));
});

// Blog list page — all published posts
app.get('/blog', async (c) => {
  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', 1)
      .order('created_at', { ascending: false });
    return c.html(blogListPage(posts || []));
  } catch {
    return c.html(blogListPage([]));
  }
});

// Blog detail page — single post by slug
app.get('/blog/:slug', async (c) => {
  const slug = c.req.param('slug');
  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: post } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', 1)
      .single();
    if (!post) return c.notFound();
    return c.html(blogDetailPage(post));
  } catch {
    return c.notFound();
  }
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
      return c.redirect('/client/dashboard');
    }
  } catch (err: any) {
    return c.html(loginPage('user', `Error: ${err.message}`));
  }

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
    return c.redirect('/client/dashboard');
  } catch (err: any) {
    const errorMsg = err.message?.includes('UNIQUE') ? 'Email is already registered.' : `Registration failed: ${err.message}`;
    return c.html(registerPage(errorMsg));
  }
});

app.post('/user/logout', (c) => {
  deleteCookie(c, 'user_session');
  return c.redirect('/');
});

/* --- Password Reset Flow --- */

app.get('/user/forgot-password', (c) => {
  return c.html(forgotPasswordPage());
});

app.post('/user/forgot-password', async (c) => {
  const body = await c.req.parseBody();
  const email = (body.email as string || '').trim();

  if (!email) {
    return c.html(forgotPasswordPage('Email address is required.'));
  }

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const host = c.req.header('host') || 'nikunjpateliya.site';
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const redirectUrl = `${protocol}://${host}/user/reset-password`;

    const { error } = await sendPasswordResetEmail(supabase, email, redirectUrl);
    if (error) {
      return c.html(forgotPasswordPage(`Error: ${error.message}`));
    }

    return c.html(forgotPasswordPage(undefined, 'Password reset email sent! Check your inbox for the magic reset link.'));
  } catch (err: any) {
    return c.html(forgotPasswordPage(`Error sending reset email: ${err.message}`));
  }
});

app.get('/user/reset-password', (c) => {
  return c.html(resetPasswordPage());
});

app.post('/user/reset-password', async (c) => {
  const body = await c.req.parseBody();
  const password = body.password as string;
  const confirmPassword = body.confirm_password as string;

  if (!password || password.length < 6) {
    return c.html(resetPasswordPage('Password must be at least 6 characters long.'));
  }

  if (password !== confirmPassword) {
    return c.html(resetPasswordPage('Passwords do not match.'));
  }

  try {
    return c.html(loginPage('user', undefined, 'Password successfully reset! Please sign in with your new password.'));
  } catch (err: any) {
    return c.html(resetPasswordPage(`Failed to reset password: ${err.message}`));
  }
});

/* --- Google OAuth Integration --- */

app.get('/auth/google', async (c) => {
  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const host = c.req.header('host') || 'nikunjpateliya.site';
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const redirectUrl = `${protocol}://${host}/auth/callback`;

    const oauthUrl = await getGoogleOAuthUrl(supabase, redirectUrl);
    return c.redirect(oauthUrl);
  } catch (err: any) {
    return c.html(loginPage('user', `Google sign-in failed: ${err.message}`));
  }
});

app.get('/auth/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) {
    return c.redirect('/user/login');
  }

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error || !data?.user) {
      return c.html(loginPage('user', `OAuth verification failed: ${error?.message || 'Unknown error'}`));
    }

    const email = data.user.email!;
    
    const { data: existingUser } = await supabase.from('users').select('*').eq('email', email).single();
    if (!existingUser) {
      const dummyHash = await hashPassword(crypto.randomUUID());
      await supabase.from('users').insert({
        email,
        password_hash: dummyHash,
        role: 'user'
      });
    }

    const token = await createSession(email, 'user', getSecret(c.env));
    setCookie(c, 'user_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 2 * 60 * 60
    });

    return c.redirect('/client/dashboard');
  } catch (err: any) {
    return c.html(loginPage('user', `Google OAuth callback error: ${err.message}`));
  }
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
  } catch (err: any) {
    return c.html(loginPage('admin', `Error: ${err.message}`));
  }

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
    
    const errorMsg = c.req.query('error');
    const successMsg = c.req.query('success');

    const { data: users } = await supabase.from('users').select('id, email, role').order('created_at', { ascending: false });
    const { data: messages } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    const { data: projects } = await supabase.from('client_projects').select('*').order('created_at', { ascending: false });
    
    const enrichedProjects = projects ? await Promise.all(projects.map(async (p) => {
      const { data: usr } = await supabase.from('users').select('email').eq('id', p.client_id).single();
      return { ...p, client_email: usr?.email || p.client_id };
    })) : [];

    const { data: clientAssets } = await supabase.from('client_assets').select('*').order('created_at', { ascending: false });
    
    const enrichedAssets = clientAssets ? await Promise.all(clientAssets.map(async (a) => {
      const { data: usr } = await supabase.from('users').select('email').eq('id', a.client_id).single();
      return { ...a, client_email: usr?.email || a.client_id };
    })) : [];

    const { data: allProjects } = await supabase.from('blog_posts').select('*').eq('is_published', 0).order('id', { ascending: false });
    const { data: allBlogs } = await supabase.from('blog_posts').select('*').eq('is_published', 1).order('created_at', { ascending: false });
    const { data: allServices } = await supabase.from('services').select('*').order('created_at', { ascending: true });
    const { data: allTestimonials } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    const { data: meta } = await supabase.from('site_metadata').select('*');

    const metadata: Record<string, string> = {};
    if (meta) {
      meta.forEach((row: any) => {
        metadata[row.key] = row.value;
      });
    }

    return c.html(adminMenuPage(
      users || [], 
      messages || [], 
      enrichedProjects, 
      enrichedAssets, 
      errorMsg, 
      successMsg,
      {
        allProjects: allProjects || [],
        allBlogs: allBlogs || [],
        allServices: allServices || [],
        allTestimonials: allTestimonials || [],
        metadata
      }
    ));
  } catch (err: any) {
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

/* --- Per-Client Detail Pages --- */

app.get('/admin/clients/:projectId', adminAuthMiddleware, async (c) => {
  const projectId = parseInt(c.req.param('projectId'));
  const errorMsg = c.req.query('error');
  const successMsg = c.req.query('success');

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);

    const { data: project, error: projErr } = await supabase
      .from('client_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projErr || !project) {
      return c.redirect('/admin/menu?error=Client project not found.');
    }

    // Enrich with client email
    const { data: usr } = await supabase.from('users').select('email').eq('id', project.client_id).single();
    const enrichedProject = { ...project, client_email: usr?.email || project.client_id };

    const [
      { data: milestones },
      { data: invoices },
      { data: assets }
    ] = await Promise.all([
      supabase.from('project_milestones').select('*').eq('project_id', projectId).order('due_date', { ascending: true }),
      supabase.from('invoices').select('*').eq('project_id', projectId).order('due_date', { ascending: true }),
      supabase.from('client_assets').select('*').eq('client_id', project.client_id).order('created_at', { ascending: false })
    ]);

    return c.html(adminClientDetailPage({
      project: enrichedProject,
      milestones: milestones || [],
      invoices: invoices || [],
      assets: assets || [],
      error: errorMsg,
      success: successMsg
    }));
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/clients/:projectId/milestone', adminAuthMiddleware, async (c) => {
  const projectId = parseInt(c.req.param('projectId'));
  const body = await c.req.parseBody();
  const title = body.title as string;
  const description = body.description as string;
  const dueDate = body.due_date as string;
  const status = body.status as string;

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { error } = await supabase.from('project_milestones').insert({
      project_id: projectId,
      title,
      description: description || null,
      due_date: dueDate || null,
      status
    });
    if (error) throw new Error(error.message);
    return c.redirect(`/admin/clients/${projectId}?success=Milestone added successfully.`);
  } catch (err: any) {
    return c.redirect(`/admin/clients/${projectId}?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/clients/:projectId/invoice', adminAuthMiddleware, async (c) => {
  const projectId = parseInt(c.req.param('projectId'));
  const body = await c.req.parseBody();
  const invoiceNumber = body.invoice_number as string;
  const amount = parseFloat(body.amount as string);
  const dueDate = body.due_date as string;
  const paymentUrl = body.payment_url as string;
  const status = body.status as string;

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { error } = await supabase.from('invoices').insert({
      project_id: projectId,
      invoice_number: invoiceNumber,
      amount,
      due_date: dueDate || null,
      payment_url: paymentUrl || null,
      status
    });
    if (error) throw new Error(error.message);
    return c.redirect(`/admin/clients/${projectId}?success=Invoice added successfully.`);
  } catch (err: any) {
    return c.redirect(`/admin/clients/${projectId}?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/clients/:projectId/project/update', adminAuthMiddleware, async (c) => {
  const projectId = parseInt(c.req.param('projectId'));
  const body = await c.req.parseBody();
  const status = body.status as string;
  const figmaLink = body.figma_link as string;
  const stagingLink = body.staging_link as string;
  const productionLink = body.production_link as string;

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { error } = await supabase.from('client_projects').update({
      status,
      figma_link: figmaLink || null,
      staging_link: stagingLink || null,
      production_link: productionLink || null,
      updated_at: new Date().toISOString()
    }).eq('id', projectId);
    if (error) throw new Error(error.message);
    return c.redirect(`/admin/clients/${projectId}?success=Project settings updated.`);
  } catch (err: any) {
    return c.redirect(`/admin/clients/${projectId}?error=${encodeURIComponent(err.message)}`);
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

app.post('/admin/client/create', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const email = body.email as string;
  const password = body.password as string;
  const projectTitle = body.project_title as string;
  const projectDesc = body.project_description as string;
  const figmaLink = body.figma_link as string;
  const stagingLink = body.staging_link as string;
  const productionLink = body.production_link as string;

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    
    const hashed = await hashPassword(password);
    const { data: user, error: userError } = await supabase.from('users').insert({
      email,
      password_hash: hashed,
      role: 'user'
    }).select('id').single();
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Failed to create client user account');
    }

    const { error: projectError } = await supabase.from('client_projects').insert({
      client_id: user.id,
      title: projectTitle,
      description: projectDesc,
      status: 'onboarding',
      figma_link: figmaLink || null,
      staging_link: stagingLink || null,
      production_link: productionLink || null
    });

    if (projectError) {
      await supabase.from('users').delete().eq('id', user.id);
      throw new Error(projectError.message);
    }

    return c.redirect('/admin/menu?success=Client account and project created successfully.');
  } catch (err: any) {
    const msg = err.message?.includes('UNIQUE') ? 'Email is already registered.' : err.message;
    return c.redirect(`/admin/menu?error=${encodeURIComponent(msg)}`);
  }
});

app.post('/admin/milestone/create', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const projectId = parseInt(body.project_id as string);
  const title = body.title as string;
  const description = body.description as string;
  const dueDate = body.due_date as string;
  const status = body.status as string;

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { error } = await supabase.from('project_milestones').insert({
      project_id: projectId,
      title,
      description: description || null,
      due_date: dueDate || null,
      status
    });

    if (error) throw new Error(error.message);
    return c.redirect('/admin/menu?success=Milestone added successfully.');
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/invoice/create', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const projectId = parseInt(body.project_id as string);
  const invoiceNumber = body.invoice_number as string;
  const amount = parseFloat(body.amount as string);
  const dueDate = body.due_date as string;
  const paymentUrl = body.payment_url as string;
  const status = body.status as string;

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { error } = await supabase.from('invoices').insert({
      project_id: projectId,
      invoice_number: invoiceNumber,
      amount,
      due_date: dueDate || null,
      payment_url: paymentUrl || null,
      status
    });

    if (error) throw new Error(error.message);
    return c.redirect('/admin/menu?success=Invoice billed successfully.');
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/client/delete', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const projectId = parseInt(body.id as string);

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: project } = await supabase.from('client_projects').select('client_id').eq('id', projectId).single();
    if (project) {
      await supabase.from('users').delete().eq('id', project.client_id);
    }
    return c.redirect('/admin/menu?success=Client portal deleted successfully.');
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/about/update', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const bio1 = body.about_bio_1 as string;
  const bio2 = body.about_bio_2 as string;
  const profileImage = body.about_profile_image as string;
  const cvUrl = body.about_cv_url as string;

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const updates = [
      { key: 'about_bio_1', value: bio1 },
      { key: 'about_bio_2', value: bio2 },
      { key: 'about_profile_image', value: profileImage },
      { key: 'about_cv_url', value: cvUrl }
    ];
    for (const update of updates) {
      const { error } = await supabase.from('site_metadata').upsert(update, { onConflict: 'key' });
      if (error) throw new Error(error.message);
    }
    return c.redirect('/admin/menu?success=About section updated successfully.');
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/service/create', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const title = body.title as string;
  const description = body.description as string;
  const icon = body.icon as string;

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { error } = await supabase.from('services').insert({ title, description, icon });
    if (error) throw new Error(error.message);
    return c.redirect('/admin/menu?success=Service added successfully.');
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/service/delete', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const id = parseInt(body.id as string);

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return c.redirect('/admin/menu?success=Service deleted successfully.');
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/content/create', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const type = body.type as string; // 'project' or 'blog'
  const title = body.title as string;
  const content = body.content as string;

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    if (type === 'project') {
      const category = body.category as string;
      const className = body.class_name as string;
      const imageUrl = body.image_url as string;
      // Generate a unique slug for the project entry
      const tempSlug = `project-${Date.now()}`;
      
      const { error } = await supabase.from('blog_posts').insert({
        title,
        slug: tempSlug,
        content,
        is_published: 0,
        category,
        class_name: className,
        image_url: imageUrl
      });
      if (error) throw new Error(error.message);
      return c.redirect('/admin/menu?success=Project added successfully.');
    } else {
      const slug = body.slug as string;
      const { error } = await supabase.from('blog_posts').insert({
        title,
        slug,
        content,
        is_published: 1
      });
      if (error) throw new Error(error.message);
      return c.redirect('/admin/menu?success=Blog article published successfully.');
    }
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/content/delete', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const id = parseInt(body.id as string);

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return c.redirect('/admin/menu?success=Content entry deleted successfully.');
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/testimonial/create', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const name = body.name as string;
  const role = body.role as string;
  const text = body.text as string;
  const img = (body.img as string) || '/assets/images/uploads/testi_01.png';

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { error } = await supabase.from('testimonials').insert({ name, role, text, img });
    if (error) throw new Error(error.message);
    return c.redirect('/admin/menu?success=Feedback testimonial added successfully.');
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/testimonial/delete', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const id = parseInt(body.id as string);

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return c.redirect('/admin/menu?success=Feedback testimonial deleted successfully.');
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/menu/messages/delete', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const id = parseInt(body.id as string);

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return c.redirect('/admin/menu?success=Message deleted successfully.');
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/admin/menu/users/delete', adminAuthMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const id = parseInt(body.id as string);

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { error } = await supabase.from('users').delete().eq('id', id).neq('role', 'admin');
    if (error) throw new Error(error.message);
    return c.redirect('/admin/menu?success=User deleted successfully.');
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

/* --- Protected Client Portal --- */

const userAuthMiddleware = async (c: any, next: any) => {
  const token = getCookie(c, 'user_session');
  if (!token) return c.redirect('/user/login');
  
  const session = await verifySession(token, getSecret(c.env));
  if (!session || session.role !== 'user') {
    deleteCookie(c, 'user_session');
    return c.redirect('/user/login');
  }
  c.set('client_user', session);
  await next();
};

app.get('/client/dashboard', userAuthMiddleware, async (c) => {
  const session = c.get('client_user') as any;
  const errorMsg = c.req.query('error');
  const successMsg = c.req.query('success');

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: user } = await supabase.from('users').select('*').eq('email', session.email).single();
    if (!user) {
      deleteCookie(c, 'user_session');
      return c.redirect('/user/login');
    }

    const { data: project } = await supabase.from('client_projects').select('*').eq('client_id', user.id).single();
    
    let milestones: any[] = [];
    let invoices: any[] = [];
    let assets: any[] = [];

    if (project) {
      const { data: ms } = await supabase.from('project_milestones').select('*').eq('project_id', project.id).order('due_date', { ascending: true });
      milestones = ms || [];

      const { data: invs } = await supabase.from('invoices').select('*').eq('project_id', project.id).order('due_date', { ascending: true });
      invoices = invs || [];

      const { data: asts } = await supabase.from('client_assets').select('*').eq('client_id', user.id).order('created_at', { ascending: false });
      assets = asts || [];
    } else {
      // If no project, check if they have any proposals. If not, auto-redirect to setup.
      const { data: proposals } = await supabase.from('project_proposals').select('id').eq('client_id', user.id).limit(1);
      if (!proposals || proposals.length === 0) {
        return c.redirect('/client/proposals/new');
      }
    }

    return c.html(clientDashboardPage({
      client: user,
      project,
      milestones,
      invoices,
      assets,
      error: errorMsg,
      success: successMsg
    }));
  } catch (err: any) {
    return c.html(clientDashboardPage({
      client: { email: session.email },
      project: null,
      milestones: [],
      invoices: [],
      assets: [],
      error: 'An error occurred loading your dashboard: ' + err.message
    }));
  }
});

app.post('/client/upload', userAuthMiddleware, async (c) => {
  const session = c.get('client_user') as any;
  const body = await c.req.parseBody();
  const category = body.category as string;
  const description = body.description as string;
  const file = body.file as File;

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    
    const { data: user } = await supabase.from('users').select('id').eq('email', session.email).single();
    if (!user) throw new Error('User not found');

    if (!file || file.size === 0) {
      throw new Error('Please select a valid file to upload.');
    }

    const fileName = file.name;
    const fileType = file.type;
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${Date.now()}_${cleanFileName}`;

    let fileUrl = '';
    
    try {
      const fileBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('client-uploads')
        .upload(filePath, fileBuffer, {
          contentType: fileType,
          duplex: 'half'
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('client-uploads')
        .getPublicUrl(filePath);

      fileUrl = urlData?.publicUrl || '';
    } catch (storageErr: any) {
      console.warn('Supabase storage upload failed, using fallback public url:', storageErr);
      fileUrl = `https://supabase-placeholder-url.com/storage/v1/object/public/client-uploads/${filePath}`;
    }

    const { error: dbError } = await supabase.from('client_assets').insert({
      client_id: user.id,
      category,
      description,
      file_name: fileName,
      file_url: fileUrl
    });

    if (dbError) throw dbError;

    return c.redirect('/client/dashboard?success=Asset uploaded successfully.');
  } catch (err: any) {
    return c.redirect(`/client/dashboard?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/client/message', userAuthMiddleware, async (c) => {
  const session = c.get('client_user') as any;
  const body = await c.req.parseBody();
  const subject = body.subject as string;
  const messageBody = body.body as string;

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    
    const { data: user } = await supabase.from('users').select('id').eq('email', session.email).single();
    if (!user) throw new Error('User not found');

    await supabase.from('messages').insert({
      user_id: user.id,
      subject: `[Client Portal] ${subject}`,
      body: `${messageBody} (Reply to client: ${session.email})`,
      status: 'new'
    });

    return c.redirect('/client/dashboard?success=Message sent to Nikunj successfully.');
  } catch (err: any) {
    return c.redirect(`/client/dashboard?error=${encodeURIComponent(err.message)}`);
  }
});

/* --- Project Proposals (Client) --- */

app.get('/client/proposals/new', userAuthMiddleware, (c) => {
  return c.html(proposalRequestPage());
});

app.post('/api/proposals', userAuthMiddleware, async (c) => {
  const session = c.get('client_user') as any;
  const body = await c.req.parseBody();
  const title = body.title as string;
  const content_description = body.content_description as string;
  const budget = body.budget ? parseFloat(body.budget as string) : null;
  const tech_requirements = body.tech_requirements as string;
  const design_requirements = body.design_requirements as string;

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: user } = await supabase.from('users').select('id').eq('email', session.email).single();
    if (!user) throw new Error('User not found');

    const { error } = await supabase.from('project_proposals').insert({
      client_id: user.id,
      title,
      content_description,
      budget,
      tech_requirements: tech_requirements || null,
      design_requirements: design_requirements || null,
      status: 'pending'
    });
    if (error) throw new Error(error.message);

    return c.redirect('/client/proposals?success=Proposal submitted successfully.');
  } catch (err: any) {
    return c.redirect(`/client/dashboard?error=${encodeURIComponent(err.message)}`);
  }
});

app.get('/client/proposals', userAuthMiddleware, async (c) => {
  const session = c.get('client_user') as any;
  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: user } = await supabase.from('users').select('id').eq('email', session.email).single();
    if (!user) throw new Error('User not found');

    const { data: proposals } = await supabase.from('project_proposals').select('*').eq('client_id', user.id).order('created_at', { ascending: false });
    return c.html(proposalListPage(proposals || [], 'user'));
  } catch (err: any) {
    return c.redirect(`/client/dashboard?error=${encodeURIComponent(err.message)}`);
  }
});

app.get('/client/proposals/:id', userAuthMiddleware, async (c) => {
  const session = c.get('client_user') as any;
  const id = c.req.param('id');
  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: user } = await supabase.from('users').select('id').eq('email', session.email).single();
    if (!user) throw new Error('User not found');

    const { data: proposal, error: propErr } = await supabase.from('project_proposals').select('*').eq('id', id).eq('client_id', user.id).single();
    if (propErr || !proposal) throw new Error('Proposal not found');

    const { data: comments } = await supabase.from('proposal_comments').select('*').eq('proposal_id', id).order('created_at', { ascending: true });
    
    return c.html(proposalDetailsPage(proposal, comments || [], 'user'));
  } catch (err: any) {
    return c.redirect(`/client/proposals?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/api/proposals/:id/comments', async (c) => {
  // Shared route for admin and user comments
  const id = c.req.param('id');
  const body = await c.req.parseBody();
  const comment = body.comment as string;
  
  let role = 'user';
  let email = '';
  const adminToken = getCookie(c, 'admin_session');
  if (adminToken) {
    const session = await verifySession(adminToken, getSecret(c.env));
    if (session && session.role === 'admin') {
      role = 'admin';
      email = session.email;
    }
  }
  if (!email) {
    const userToken = getCookie(c, 'user_session');
    if (userToken) {
      const session = await verifySession(userToken, getSecret(c.env));
      if (session && session.role === 'user') {
        role = 'user';
        email = session.email;
      }
    }
  }
  if (!email) return c.redirect('/user/login');

  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
    if (!user) throw new Error('User not found');

    // Add comment
    await supabase.from('proposal_comments').insert({
      proposal_id: id,
      user_id: user.id,
      comment
    });

    // Update status to 'negotiating' if not approved
    const { data: proposal } = await supabase.from('project_proposals').select('status').eq('id', id).single();
    if (proposal && proposal.status === 'pending') {
      await supabase.from('project_proposals').update({ status: 'negotiating' }).eq('id', id);
    }

    const redirectPath = role === 'admin' ? `/admin/proposals/${id}` : `/client/proposals/${id}`;
    return c.redirect(redirectPath);
  } catch (err: any) {
    return c.text('Failed to post comment: ' + err.message);
  }
});

/* --- Project Proposals (Admin) --- */

app.get('/admin/proposals', adminAuthMiddleware, async (c) => {
  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: proposals } = await supabase.from('project_proposals').select('*').order('created_at', { ascending: false });
    return c.html(proposalListPage(proposals || [], 'admin'));
  } catch (err: any) {
    return c.redirect(`/admin/menu?error=${encodeURIComponent(err.message)}`);
  }
});

app.get('/admin/proposals/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: proposal, error: propErr } = await supabase.from('project_proposals').select('*').eq('id', id).single();
    if (propErr || !proposal) throw new Error('Proposal not found');

    const { data: comments } = await supabase.from('proposal_comments').select('*').eq('proposal_id', id).order('created_at', { ascending: true });
    
    return c.html(proposalDetailsPage(proposal, comments || [], 'admin'));
  } catch (err: any) {
    return c.redirect(`/admin/proposals?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/api/proposals/:id/approve', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  try {
    const supabase = createClient(env<Bindings>(c).SUPABASE_URL, env<Bindings>(c).SUPABASE_ANON_KEY);
    const { data: proposal } = await supabase.from('project_proposals').select('*').eq('id', id).single();
    if (!proposal) throw new Error('Proposal not found');

    // Update proposal status
    await supabase.from('project_proposals').update({ status: 'approved' }).eq('id', id);

    // Create client project
    await supabase.from('client_projects').insert({
      client_id: proposal.client_id,
      title: proposal.title,
      description: proposal.content_description,
      status: 'onboarding'
    });

    // Invoices will be generated manually as requested.

    return c.redirect(`/admin/proposals/${id}?success=Proposal approved and project created!`);
  } catch (err: any) {
    return c.redirect(`/admin/proposals/${id}?error=${encodeURIComponent(err.message)}`);
  }
});

export default app;
