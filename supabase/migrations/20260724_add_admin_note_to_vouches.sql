-- Adds an admin-only note field to vouches.
-- Run this in the Supabase SQL editor (or via CLI) against your project.

alter table public.vouches
  add column if not exists admin_note text;
