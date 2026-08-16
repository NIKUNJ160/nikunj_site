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
