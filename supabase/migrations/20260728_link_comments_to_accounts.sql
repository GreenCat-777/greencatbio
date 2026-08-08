-- Lets comments optionally be tied to a real account (guest posting still works —
-- user_id stays null for guests). Also a reminder for the password-account switch.
--
-- IMPORTANT: In Supabase Dashboard -> Authentication -> Providers -> Email:
--   - Turn ON "Email" provider with password sign-in (should be on by default)
--   - Turn ON "Confirm email" so accounts require email verification
-- And under Authentication -> URL Configuration, make sure Redirect URLs include:
--   https://www.greencat777.xyz/pm
--   https://www.greencat777.xyz/pm/reset
-- Run this SQL in the Supabase SQL editor.

alter table public.comments
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists comments_user_id_idx on public.comments (user_id);
