-- Database schema for nikunj-site

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    is_published INTEGER DEFAULT 0 CHECK(is_published IN (0, 1)),
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'read', 'replied')),
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS site_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Seed default admin account (email: [EMAIL_ADDRESS], password: admin123)
INSERT OR IGNORE INTO users (email, password_hash, role)
VALUES ('[EMAIL_ADDRESS]', '037e3b7ee499a27bec84152fa9449844:dc348759dae044aa8ec1525f45dbe3df2b842645a1983ccce15b94e76be92e7d', 'admin');
