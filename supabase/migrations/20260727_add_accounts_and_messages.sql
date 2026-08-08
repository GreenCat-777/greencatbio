-- Private messaging: profiles (usernames) + messages, backed by Supabase Auth.
-- Run this in the Supabase SQL editor.
--
-- Before running: in Supabase Dashboard -> Authentication -> Providers,
-- make sure "Email" is enabled with "Confirm email" / magic link OTP on.
-- Also set Authentication -> URL Configuration -> Site URL and Redirect URLs
-- to include https://www.greencat777.xyz/pm (and your preview/localhost URLs).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  read_at timestamptz
);

create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists messages_recipient_idx on public.messages (recipient_id);

alter table public.profiles enable row level security;
alter table public.messages enable row level security;

-- Anyone logged in can look up usernames (needed to start a chat / show names).
drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- You can only create/update your own profile row.
drop policy if exists "users manage own profile" on public.profiles;
create policy "users manage own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- You can only see messages you sent or received.
drop policy if exists "users read own messages" on public.messages;
create policy "users read own messages"
  on public.messages for select
  to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

-- You can only send messages as yourself.
drop policy if exists "users send messages as self" on public.messages;
create policy "users send messages as self"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid());

-- You can mark messages sent to you as read.
drop policy if exists "users mark own inbox read" on public.messages;
create policy "users mark own inbox read"
  on public.messages for update
  to authenticated
  using (recipient_id = auth.uid());
