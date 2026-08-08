-- Adds columns to support the self-service "your rights" flow
-- (edit / delete / request-info), gated by a one-time emailed link.
-- Run this in the Supabase SQL editor against your project.

alter table public.vouches
  add column if not exists access_token text,
  add column if not exists access_token_expires timestamptz,
  add column if not exists access_action text;

create index if not exists vouches_access_token_idx on public.vouches (access_token);
