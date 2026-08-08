-- Moves account verification, password reset, and email change entirely
-- off Supabase's built-in auth email system and onto our own Resend flow
-- (same pattern as vouches' access_token). Supabase Auth itself is still
-- used for password storage/sessions — just never triggers its own emails.
-- Run this in the Supabase SQL editor.

alter table public.profiles
  add column if not exists verified boolean not null default false,
  add column if not exists action_token text,
  add column if not exists action_token_expires timestamptz,
  add column if not exists action_type text,
  add column if not exists pending_email text;

create index if not exists profiles_action_token_idx on public.profiles (action_token);
