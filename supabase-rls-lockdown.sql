-- Run in Supabase SQL Editor after deploying the server routes.
-- Keeps public reads working, blocks browser-side anon writes, and lets service-role APIs write.

alter table public.settings enable row level security;
alter table public.sections enable row level security;
alter table public.posts enable row level security;
alter table public."seoPages" enable row level security;

drop policy if exists "Allow public all access on settings" on public.settings;
drop policy if exists "Allow public all access on sections" on public.sections;
drop policy if exists "Allow public all access on posts" on public.posts;
drop policy if exists "Allow public all access on seoPages" on public."seoPages";

drop policy if exists "Allow public read access on settings" on public.settings;
drop policy if exists "Allow public read access on sections" on public.sections;
drop policy if exists "Allow public read access on posts" on public.posts;
drop policy if exists "Allow public read access on seoPages" on public."seoPages";

create policy "Public can read settings"
on public.settings
for select
using (true);

create policy "Public can read sections"
on public.sections
for select
using (true);

create policy "Public can read public posts"
on public.posts
for select
using (
  coalesce(data->>'status', 'published') = 'published'
  and coalesce(data->>'visibility', 'public') <> 'private'
);

create policy "Users can read their own submitted posts"
on public.posts
for select
to authenticated
using (auth.uid()::text = data->>'authorId');

create policy "Public can read SEO pages"
on public."seoPages"
for select
using (true);
