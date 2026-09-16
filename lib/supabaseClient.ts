// lib/supabaseClient.ts
// Client-side Supabase access. This site is a static export (see
// next.config.ts) with no server at runtime, so both the public site and the
// /admin/travel-tips page talk to Supabase directly from the browser using
// the anon key. That's the standard Supabase pattern: the anon key is meant
// to be public. Row Level Security policies on the `travel_tips` table, not
// key secrecy, are what actually gate writes to authenticated users.
// See docs/architecture/travel-tips-backend.md.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill in your Supabase project's values."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
