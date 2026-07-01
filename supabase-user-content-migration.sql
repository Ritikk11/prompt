-- User content architecture migration for AI Prompt Matrix.
-- Run this in Supabase SQL Editor after the server API routes are deployed.
--
-- Goals:
-- 1) Stop storing user activity inside posts.data JSONB.
-- 2) Keep public reads working.
-- 3) Block browser-side anon writes to core CMS tables.
-- 4) Let server routes write through the Supabase service role.

begin;

-- Core CMS tables: public can read, but anon/authenticated clients cannot write directly.
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

drop policy if exists "Public can read settings" on public.settings;
drop policy if exists "Public can read sections" on public.sections;
drop policy if exists "Public can read public posts" on public.posts;
drop policy if exists "Users can read their own submitted posts" on public.posts;
drop policy if exists "Authenticated users can read public or own posts" on public.posts;
drop policy if exists "Public can read SEO pages" on public."seoPages";

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
to anon
using (
  coalesce(data->>'status', 'published') = 'published'
  and coalesce(data->>'visibility', 'public') <> 'private'
);

create policy "Authenticated users can read public or own posts"
on public.posts
for select
to authenticated
using (
  (
    coalesce(data->>'status', 'published') = 'published'
    and coalesce(data->>'visibility', 'public') <> 'private'
  )
  or (select auth.uid())::text = data->>'authorId'
);

create policy "Public can read SEO pages"
on public."seoPages"
for select
using (true);

-- Logged-in likes. Anonymous likes are still handled by the API/local browser state
-- during the transition; this table is for account-bound likes.
create table if not exists public.user_likes (
  post_id text not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.user_likes enable row level security;

drop policy if exists "Users can read own likes" on public.user_likes;
drop policy if exists "Users can insert own likes" on public.user_likes;
drop policy if exists "Users can delete own likes" on public.user_likes;

create policy "Users can read own likes"
on public.user_likes
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Writes are intentionally performed by server routes using the service role.
-- These policies exist for future direct-client flows, but server routes remain preferred.
create policy "Users can insert own likes"
on public.user_likes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete own likes"
on public.user_likes
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists user_likes_user_id_idx on public.user_likes(user_id);

-- Saved/bookmarked posts require login.
create table if not exists public.user_bookmarks (
  post_id text not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.user_bookmarks enable row level security;

drop policy if exists "Users can read own bookmarks" on public.user_bookmarks;
drop policy if exists "Users can insert own bookmarks" on public.user_bookmarks;
drop policy if exists "Users can delete own bookmarks" on public.user_bookmarks;

create policy "Users can read own bookmarks"
on public.user_bookmarks
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own bookmarks"
on public.user_bookmarks
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete own bookmarks"
on public.user_bookmarks
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists user_bookmarks_user_id_idx on public.user_bookmarks(user_id);

-- Comments are separate from post JSON. Public visitors can read approved comments.
-- Signed-in users can read their own pending comments.
create table if not exists public.comments (
  id text primary key,
  post_id text not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null default 'Reader',
  user_avatar text,
  text text not null,
  status text not null default 'pending' check (status in ('approved', 'pending', 'spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists comments_user_id_idx on public.comments(user_id);
create index if not exists comments_status_idx on public.comments(status);

alter table public.comments enable row level security;

drop policy if exists "Public can read approved comments" on public.comments;
drop policy if exists "Users can read own comments" on public.comments;
drop policy if exists "Authenticated users can read approved or own comments" on public.comments;

create policy "Public can read approved comments"
on public.comments
for select
to anon
using (status = 'approved');

create policy "Authenticated users can read approved or own comments"
on public.comments
for select
to authenticated
using (status = 'approved' or (select auth.uid()) = user_id);

-- User submissions are a separate queue. Approval creates/updates a row in posts.
create table if not exists public.submissions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists submissions_user_id_idx on public.submissions(user_id);
create index if not exists submissions_status_idx on public.submissions(status);
create index if not exists submissions_reviewed_by_idx on public.submissions(reviewed_by);

alter table public.submissions enable row level security;

drop policy if exists "Users can read own submissions" on public.submissions;

create policy "Users can read own submissions"
on public.submissions
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Newsletter subscribers live in their own table instead of a JSON array in settings.
-- Public users submit through /api/newsletter; only the server service role can write/read.
create table if not exists public.newsletter_subscribers (
  email text primary key,
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  source text not null default 'homepage',
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Service role can manage newsletter subscribers" on public.newsletter_subscribers;

create policy "Service role can manage newsletter subscribers"
on public.newsletter_subscribers
for all
to service_role
using (true)
with check (true);

grant select, insert, update, delete on public.newsletter_subscribers to service_role;

insert into public.newsletter_subscribers (email, status, source, consent_at, created_at, updated_at)
select
  lower(sub->>'email'),
  case when sub->>'status' in ('subscribed', 'unsubscribed') then sub->>'status' else 'subscribed' end,
  coalesce(sub->>'source', 'homepage'),
  coalesce((sub->>'consentAt')::timestamptz, now()),
  coalesce((sub->>'createdAt')::timestamptz, now()),
  coalesce((sub->>'updatedAt')::timestamptz, now())
from public.settings,
     jsonb_array_elements(coalesce(data->'subscribers', '[]'::jsonb)) as sub
where id = 'newsletter_subscribers'
  and sub->>'email' is not null
on conflict (email) do update
set status = excluded.status,
    source = excluded.source,
    consent_at = excluded.consent_at,
    updated_at = excluded.updated_at;

delete from public.settings where id = 'newsletter_subscribers';

commit;
