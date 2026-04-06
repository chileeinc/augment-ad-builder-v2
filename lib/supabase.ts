import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — safe to use in client components
export const supabase = createClient(url, anon)

// Server client — call this in API routes / server components only, never in client components
export function getSupabaseAdmin() {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, service)
}
