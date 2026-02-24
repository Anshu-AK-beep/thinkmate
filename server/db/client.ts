// ─────────────────────────────────────────────────────────────
// server/db/client.ts — Supabase client singleton
//
// Uses the service role key (server-side only — never expose
// this key to the frontend, it bypasses Row Level Security)
// ─────────────────────────────────────────────────────────────

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error(
        'Missing Supabase config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
      )
    }

    _client = createClient(url, key, {
      auth: {
        persistSession: false,   // server-side, no session persistence needed
        autoRefreshToken: false,
      },
    })
  }

  return _client
}