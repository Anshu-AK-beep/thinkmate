// src/lib/supabase.ts
// Frontend Supabase client — anon key only, used for auth.
// Never put service role key in frontend code.

import { createClient } from '@supabase/supabase-js'

const url     = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession:  true,
    autoRefreshToken: true,
    detectSessionInUrl: true,   // picks up OAuth redirect tokens from URL
  },
})