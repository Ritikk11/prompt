-- Run this in your Supabase SQL Editor to create the necessary tables

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY, -- 'global'
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS "seoPages" (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
  source TEXT NOT NULL DEFAULT 'homepage',
  consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Realtime for all tables
alter publication supabase_realtime add table settings;
alter publication supabase_realtime add table sections;
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table "seoPages";

-- ENABLING ROW LEVEL SECURITY (RLS)
-- Public visitors can read public content. Writes must go through server API
-- routes using SUPABASE_SERVICE_ROLE_KEY, not the browser anon key.

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seoPages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Settings Policies
CREATE POLICY "Allow public read access on settings" ON settings FOR SELECT USING (true);

-- Sections Policies
CREATE POLICY "Allow public read access on sections" ON sections FOR SELECT USING (true);

-- Posts Policies
CREATE POLICY "Allow public read access on posts" ON posts FOR SELECT USING (
  coalesce(data->>'status', 'published') = 'published'
  and coalesce(data->>'visibility', 'public') <> 'private'
);

-- SEO Pages Policies
CREATE POLICY "Allow public read access on seoPages" ON "seoPages" FOR SELECT USING (true);

-- Newsletter subscribers are private. Public visitors write through /api/newsletter only.
CREATE POLICY "Service role can manage newsletter subscribers" ON newsletter_subscribers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON newsletter_subscribers TO service_role;
