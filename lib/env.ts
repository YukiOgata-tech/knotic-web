const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL

function requireStaticEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

function getPublicApiKey() {
  const publishable = NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const anon = NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (publishable) return publishable
  if (anon) return anon

  throw new Error(
    "Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  )
}

export function hasSupabasePublicEnv() {
  return Boolean(NEXT_PUBLIC_SUPABASE_URL && getPublicApiKeySafe())
}

function getPublicApiKeySafe() {
  return NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export function getSupabasePublicEnv() {
  return {
    supabaseUrl: requireStaticEnv(
      NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL"
    ),
    supabaseAnonKey: getPublicApiKey(),
  }
}

export function getSupabaseServerKey() {
  const secret = SUPABASE_SECRET_KEY
  const serviceRole = SUPABASE_SERVICE_ROLE_KEY

  if (secret) return secret
  if (serviceRole) return serviceRole

  throw new Error(
    "Missing environment variable: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY"
  )
}

export function getAppUrl() {
  return NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}
