"use client"

import { createBrowserClient } from "@supabase/ssr"

import { getSupabasePublicEnv } from "@/lib/env"

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!browserClient) {
    const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv()
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  return browserClient
}
