alter table public.settings enable row level security;

update public.settings
set data = data - 'imgbbApiKey'
where id = 'global';

drop policy if exists "Allow public all access on settings" on public.settings;
drop policy if exists "Allow public read access on settings" on public.settings;
drop policy if exists "Block public read access on settings" on public.settings;

create policy "Block public read access on settings"
on public.settings
for select
using (false);

revoke select on public.settings from anon, authenticated;

create or replace view public.public_settings as
select
  id,
  data - 'adminEmails' - 'imgbbApiKey' - 'pinterestSettings' as data
from public.settings
where id = 'global';

grant select on public.public_settings to anon, authenticated;

create table if not exists public.upload_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists upload_events_user_created_at_idx
on public.upload_events (user_id, created_at desc);

alter table public.upload_events enable row level security;

drop policy if exists "Service role can manage upload events" on public.upload_events;

create policy "Service role can manage upload events"
on public.upload_events
for all
to service_role
using (true)
with check (true);

grant select, insert, delete on public.upload_events to service_role;
