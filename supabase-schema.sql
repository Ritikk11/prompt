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

-- Enable Realtime for all tables
alter publication supabase_realtime add table settings;
alter publication supabase_realtime add table sections;
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table "seoPages";

-- ENABLING ROW LEVEL SECURITY (RLS)
-- This allows anyone to read and write for now so your app works seamlessly.
-- In production, you would restrict the ALL/write operations to authenticated admins.

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seoPages" ENABLE ROW LEVEL SECURITY;

-- Settings Policies
CREATE POLICY "Allow public read access on settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public all access on settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Sections Policies
CREATE POLICY "Allow public read access on sections" ON sections FOR SELECT USING (true);
CREATE POLICY "Allow public all access on sections" ON sections FOR ALL USING (true) WITH CHECK (true);

-- Posts Policies
CREATE POLICY "Allow public read access on posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Allow public all access on posts" ON posts FOR ALL USING (true) WITH CHECK (true);

-- SEO Pages Policies
CREATE POLICY "Allow public read access on seoPages" ON "seoPages" FOR SELECT USING (true);
CREATE POLICY "Allow public all access on seoPages" ON "seoPages" FOR ALL USING (true) WITH CHECK (true);
