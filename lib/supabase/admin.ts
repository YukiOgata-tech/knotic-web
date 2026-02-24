import { createClient } from "@supabase/supabase-js"

import { getSupabasePublicEnv, getSupabaseServerKey } from "@/lib/env"

export function createAdminClient() {
  const { supabaseUrl } = getSupabasePublicEnv()
  const supabaseServerKey = getSupabaseServerKey()

  return createClient(supabaseUrl, supabaseServerKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
