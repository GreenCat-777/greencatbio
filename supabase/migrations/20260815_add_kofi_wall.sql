-- Kindle Ko-fi Wall: a directory of Ko-fi links for people in the Kindle
-- modding community. Entries can be submitted by anyone (pending review)
-- or added directly by the admin (auto-approved). Only approved entries
-- are publicly readable. All writes happen server-side via the service
-- role key (see /api/kofi-wall and /api/admin/kofi-wall), so no insert/
-- update/delete policies are needed here.
-- Run this in the Supabase SQL editor against your project.

create table if not exists public.kofi_wall (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kofi_url text not null,
  description text not null,
  avatar_url text,
  email text,
  admin_approved boolean not null default false,
  added_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists kofi_wall_approved_idx on public.kofi_wall (admin_approved);

alter table public.kofi_wall enable row level security;

drop policy if exists "approved kofi wall entries are publicly readable" on public.kofi_wall;
create policy "approved kofi wall entries are publicly readable"
  on public.kofi_wall for select
  using (admin_approved = true);

-- Storage bucket for entry profile pictures. Public bucket = anyone can
-- read/view the image via its public URL. Writes only happen server-side
-- with the service role key, which bypasses storage RLS, so no
-- insert/update/delete policies are required.
insert into storage.buckets (id, name, public)
values ('kofi-wall', 'kofi-wall', true)
on conflict (id) do nothing;

drop policy if exists "kofi wall avatars are publicly accessible" on storage.objects;
create policy "kofi wall avatars are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'kofi-wall');
