-- Pivots private messages to be "Talk with GreenCat" only:
-- a null sender_id means the message is FROM the admin,
-- a null recipient_id means the message is TO the admin.
-- No separate admin auth account is needed — the admin dashboard
-- sends/reads these using the service role key, which bypasses RLS.
-- Run this in the Supabase SQL editor.

alter table public.messages
  alter column sender_id drop not null,
  alter column recipient_id drop not null;

alter table public.messages
  drop constraint if exists messages_not_both_null;

alter table public.messages
  add constraint messages_not_both_null check (sender_id is not null or recipient_id is not null);
