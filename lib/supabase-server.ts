import { createClient } from "@supabase/supabase-js";

// Server-side client — uses service role key, bypasses RLS
// Uses STORAGE_SUPABASE_SECRET_KEY which is already set in your Vercel env
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    { auth: { persistSession: false } }
  );
}
