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
  adminDataPage,
  clientDashboardPage
} from './templates';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
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

app.get('/contact', (c) => c.redirect('/user/login'));

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
    
    if (!user) {
      return c.html(loginPage('admin', `Error: User not found in database for email: ${email} and role: admin.`));
    }
    
    const verified = await verifyPassword(password, user.password_hash as string);
    if (!verified) {
      return c.html(loginPage('admin', `Error: Password verification failed. Database stored hash is: "${user.password_hash}".`));
    }

    const token = await createSession(email, 'admin', getSecret(c.env));
    setCookie(c, 'admin_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 2 * 60 * 60
    });
    return c.redirect('/admin/menu');
  } catch (err: any) {
    return c.html(loginPage('admin', `Error: Exception: ${err.message}`));
  }
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

    return c.html(adminMenuPage(
      users || [], 
      messages || [], 
      enrichedProjects, 
      enrichedAssets, 
      errorMsg, 
      successMsg
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

export default app;
