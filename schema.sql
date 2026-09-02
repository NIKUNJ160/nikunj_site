-- Database schema for nikunj-site (PostgreSQL / Supabase)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    is_published INTEGER DEFAULT 0 CHECK(is_published IN (0, 1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'read', 'replied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS site_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Client Projects
CREATE TABLE IF NOT EXISTS client_projects (
    id SERIAL PRIMARY KEY,
    client_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'onboarding' CHECK(status IN ('onboarding', 'wireframing', 'development', 'testing', 'completed')),
    figma_link TEXT,
    staging_link TEXT,
    production_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Project Milestones
CREATE TABLE IF NOT EXISTS project_milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('completed', 'in_progress', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices & Payments
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('paid', 'unpaid', 'overdue')),
    due_date DATE,
    payment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client Uploaded Assets
CREATE TABLE IF NOT EXISTS client_assets (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK(category IN ('Logo', 'Content/Copy', 'Credentials', 'Design References', 'Other')),
    description TEXT,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Client Project Proposals
CREATE TABLE IF NOT EXISTS project_proposals (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_description TEXT,
    budget NUMERIC(10, 2),
    tech_requirements TEXT,
    design_requirements TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'negotiating', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Proposal Comments (Negotiation)
CREATE TABLE IF NOT EXISTS proposal_comments (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES project_proposals(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default admin account (email: [EMAIL_ADDRESS], password: admin123)
INSERT INTO users (email, password_hash, role)
VALUES ('[EMAIL_ADDRESS]', '037e3b7ee499a27bec84152fa9449844:dc348759dae044aa8ec1525f45dbe3df2b842645a1983ccce15b94e76be92e7d', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Alter blog_posts table to add category, class_name, and image_url for projects
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS class_name TEXT;

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- The SVG HTML string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default services safely
INSERT INTO services (title, description, icon)
SELECT 'Web Design', 'Clean, dual-theme layouts using modern glassmorphic principles.', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"></path><path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"></path></svg>'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE title = 'Web Design');

INSERT INTO services (title, description, icon)
SELECT 'Full-Stack Development', 'Edge-rendered Cloudflare Workers apps running with serverless databases.', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE title = 'Full-Stack Development');

INSERT INTO services (title, description, icon)
SELECT 'SEO & Strategy', 'Optimized page speeds, semantic tags, and dynamic sitemaps.', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE title = 'SEO & Strategy');

-- Seed default about details in site_metadata
INSERT INTO site_metadata (key, value)
VALUES 
('about_bio_1', 'I am a Gujarat-based Web Designer and Full-Stack Developer specializing in high-performance edge computing architectures, responsive styling, and modular layouts.'),
('about_bio_2', 'By leveraging Cloudflare Workers, Hono, and D1 SQLite databases, I construct dynamic applications that run near-instantly at the edge, bypassing bulk frameworks and heavy client dependencies.'),
('about_profile_image', '/assets/images/uploads/about.jpeg'),
('about_cv_url', '/assets/Nikunjkumar_Pateliya_CV.pdf')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    text TEXT NOT NULL,
    img TEXT NOT NULL DEFAULT '/assets/images/uploads/testi_01.png',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default testimonials safely
INSERT INTO testimonials (name, role, text, img)
SELECT 'James Fernando', 'Manager of Racer', 'Wonderful Support! They delivered our project on time with an incredibly skilled, professional team.', '/assets/images/uploads/testi_01.png'
WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE name = 'James Fernando');

INSERT INTO testimonials (name, role, text, img)
SELECT 'Jacques Philips', 'Designer', 'Awesome Services! Their attention to page speed and custom styling exceeds standard templates.', '/assets/images/uploads/testi_02.png'
WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE name = 'Jacques Philips');

INSERT INTO testimonials (name, role, text, img)
SELECT 'Venanda Mercy', 'New York City', 'Great & Talented Team! Clean layouts, high performance, and smooth animations. Highly recommended.', '/assets/images/uploads/testi_03.png'
WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE name = 'Venanda Mercy');

-- Analytics: Page Views Table
CREATE TABLE IF NOT EXISTS page_views (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    url_path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    device_type TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics: Event Logs Table (Custom Interactions & Conversions)
CREATE TABLE IF NOT EXISTS event_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_category TEXT DEFAULT 'interaction',
    url_path TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes for Fast Aggregations & Analytics Queries
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_url_path ON page_views(url_path);
CREATE INDEX IF NOT EXISTS idx_page_views_referrer ON page_views(referrer);

CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON event_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_event_name ON event_logs(event_name);
CREATE INDEX IF NOT EXISTS idx_event_logs_event_category ON event_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_event_logs_session_id ON event_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_url_path ON event_logs(url_path);

-- Seed Initial Portfolio Data (Only inserted on first database setup)
INSERT INTO services (title, description, icon) VALUES
('Web Development', 'Crafting responsive, high-performance web applications using modern, compile-free server technologies.', '<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>'),
('Responsive Design', 'Ensuring your site behaves perfectly across all viewports, from compact devices to ultrawide displays.', '<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>'),
('Creative Layouts', 'Bespoke design concepts featuring modular bento structures and custom visual typography.', '<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 1 8 4.5l-2.5 2.5a6 6 0 1 0-11 0L4 6.5A10 10 0 0 1 12 2z"></path><circle cx="12" cy="12" r="3"></circle></svg>'),
('Edge Analytics', 'Implementing fast, serverless endpoints optimized for minimal load times and zero framework overhead.', '<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>')
ON CONFLICT DO NOTHING;

INSERT INTO testimonials (name, role, text, img) VALUES
('James Fernando', 'Manager of Racer', 'Wonderful Support! They delivered our project on time with an incredibly skilled, professional team.', '/assets/images/uploads/testi_01.png'),
('Jacques Philips', 'Designer', 'Awesome Services! Their attention to page speed and custom styling exceeds standard templates.', '/assets/images/uploads/testi_02.png'),
('Venanda Mercy', 'New York City', 'Great & Talented Team! Clean layouts, high performance, and smooth animations. Highly recommended.', '/assets/images/uploads/testi_03.png')
ON CONFLICT DO NOTHING;

INSERT INTO site_metadata (key, value) VALUES
('site_name', 'Nikunj Pateliya'),
('public_role', 'Web Designer & Full-Stack Developer'),
('location', 'Gujarat, India'),
('contact_email', 'hello@nikunjpateliya.site'),
('contact_phone', '+91 93288 01435'),
('meta_description', 'Portfolio of Nikunj Pateliya, showcasing web design and full-stack development work.'),
('about_bio_1', 'Hi, I’m Nikunj Pateliya — a freelance web developer, Android creator, and website tester. I build and fine-tune high-performance digital products from the ground up, combining solid code architecture, precise quality testing, and modern UI design.'),
('about_bio_2', ''),
('about_profile_image', '/assets/images/uploads/nik.jpeg'),
('about_cv_url', '/assets/Nikunjkumar_Pateliya_CV.pdf'),
('social_github', 'https://github.com/NIKUNJ160'),
('social_linkedin', 'https://www.linkedin.com/in/nikunjpateliya1608'),
('social_instagram', 'https://www.instagram.com/_nik__16/'),
('social_whatsapp', 'https://wa.me/919328801435')
ON CONFLICT (key) DO NOTHING;

