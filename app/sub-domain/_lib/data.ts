import { notFound, redirect } from "next/navigation"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type AuditLogRow = {
  id: string
  tenant_id: string
  tenant_slug: string | null
  actor_user_id: string | null
  actor_email: string | null
  action: string
  target_type: string
  target_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type IndexingJobRow = {
  id: string
  tenant_id: string
  bot_id: string | null
  source_id: string | null
  status: string
  job_type: string
  requested_at: string
  started_at: string | null
  finished_at: string | null
  pages_indexed: number
  error_message: string | null
}

export type PlatformAdminContext = {
  user: { id: string; email?: string | null }
  role: "owner" | "staff"
  supabase: Awaited<ReturnType<typeof createClient>>
}

export type PlatformTenantRow = {
  id: string
  slug: string
  display_name: string
  active: boolean
  force_stopped: boolean
  force_stop_reason: string | null
  force_stopped_at: string | null
  created_at: string
  member_count: number
  subscription: {
    status: string
    plan_code: string | null
    plan_name: string | null
    monthly_price_jpy: number | null
    current_period_end: string | null
  } | null
  override: {
    id: number
    plan_id: number
    status: string
    billing_mode: "stripe" | "bank_transfer" | "invoice" | "manual"
    is_active: boolean
    effective_from: string
    effective_until: string | null
    notes: string | null
    plan_code: string | null
    plan_name: string | null
    monthly_price_jpy: number | null
    updated_at: string
  } | null
}

export type PlatformPlan = {
  id: number
  code: string
  name: string
  monthly_price_jpy: number
}

export type PlatformTenantMembership = {
  user_id: string
  role: "editor" | "reader"
  is_active: boolean
  created_at: string
  user_email: string | null
}

export type PlatformTenantBot = {
  id: string
  public_id: string
  name: string
  status: string
  is_public: boolean
  access_mode: string | null
  force_stopped: boolean
  force_stop_reason: string | null
  force_stopped_at: string | null
  created_at: string
}

export type PlatformTenantDetail = {
  tenant: PlatformTenantRow
  plans: PlatformPlan[]
  memberships: PlatformTenantMembership[]
  bots: PlatformTenantBot[]
  usage30dMessages: number
  usage30dTokensOut: number
}

export async function requirePlatformAdminContext(): Promise<PlatformAdminContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/sub-domain")
  }

  const { data: adminRow } = await supabase
    .from("platform_admin_users")
    .select("role, is_active")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!adminRow?.is_active) {
    redirect("/console/overview?error=permission_denied")
  }

  return {
    user: { id: user.id, email: user.email },
    role: adminRow.role as "owner" | "staff",
    supabase,
  }
}

export async function fetchPlatformDashboard(searchText?: string): Promise<{
  tenants: PlatformTenantRow[]
  plans: PlatformPlan[]
}> {
  const admin = createAdminClient()
  const search = (searchText ?? "").trim().toLowerCase()

  let tenantQuery = admin
    .from("tenants")
    .select("id, slug, display_name, active, force_stopped, force_stop_reason, force_stopped_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (search) {
    tenantQuery = tenantQuery.or(`slug.ilike.%${search}%,display_name.ilike.%${search}%`)
  }

  const [{ data: tenantsRaw }, { data: plansRaw }] = await Promise.all([
    tenantQuery,
    admin
      .from("plans")
      .select("id, code, name, monthly_price_jpy")
      .order("monthly_price_jpy", { ascending: true }),
  ])

  const tenants = (tenantsRaw ?? []) as Array<{
    id: string
    slug: string
    display_name: string
    active: boolean
    force_stopped: boolean
    force_stop_reason: string | null
    force_stopped_at: string | null
    created_at: string
  }>

  const tenantIds = tenants.map((row) => row.id)
  if (tenantIds.length === 0) {
    return {
      tenants: [],
      plans: (plansRaw ?? []) as PlatformPlan[],
    }
  }

  const [{ data: subsRaw }, { data: overridesRaw }, { data: membersRaw }] = await Promise.all([
    admin
      .from("subscriptions")
      .select("tenant_id, status, current_period_end, created_at, plans(code,name,monthly_price_jpy)")
      .in("tenant_id", tenantIds)
      .order("created_at", { ascending: false }),
    admin
      .from("tenant_contract_overrides")
      .select(
        "id, tenant_id, plan_id, status, billing_mode, is_active, effective_from, effective_until, notes, updated_at, plans(code,name,monthly_price_jpy)"
      )
      .in("tenant_id", tenantIds),
    admin
      .from("tenant_memberships")
      .select("tenant_id")
      .in("tenant_id", tenantIds)
      .eq("is_active", true),
  ])

  const subMap = new Map<string, PlatformTenantRow["subscription"]>()
  for (const row of subsRaw ?? []) {
    if (subMap.has(row.tenant_id)) continue
    const plan = Array.isArray(row.plans) ? row.plans[0] : row.plans
    subMap.set(row.tenant_id, {
      status: row.status,
      plan_code: plan?.code ?? null,
      plan_name: plan?.name ?? null,
      monthly_price_jpy: plan?.monthly_price_jpy ?? null,
      current_period_end: row.current_period_end ?? null,
    })
  }

  const overrideMap = new Map<string, PlatformTenantRow["override"]>()
  for (const row of overridesRaw ?? []) {
    const plan = Array.isArray(row.plans) ? row.plans[0] : row.plans
    overrideMap.set(row.tenant_id, {
      id: row.id,
      plan_id: row.plan_id,
      status: row.status,
      billing_mode: row.billing_mode,
      is_active: row.is_active,
      effective_from: row.effective_from,
      effective_until: row.effective_until,
      notes: row.notes,
      plan_code: plan?.code ?? null,
      plan_name: plan?.name ?? null,
      monthly_price_jpy: plan?.monthly_price_jpy ?? null,
      updated_at: row.updated_at,
    })
  }

  const memberCountMap = new Map<string, number>()
  for (const row of membersRaw ?? []) {
    memberCountMap.set(row.tenant_id, (memberCountMap.get(row.tenant_id) ?? 0) + 1)
  }

  return {
    tenants: tenants.map((row) => ({
      ...row,
      member_count: memberCountMap.get(row.id) ?? 0,
      subscription: subMap.get(row.id) ?? null,
      override: overrideMap.get(row.id) ?? null,
    })),
    plans: (plansRaw ?? []) as PlatformPlan[],
  }
}

export async function fetchAuditLogs(options?: {
  tenantId?: string
  actionPrefix?: string
  page?: number
  perPage?: number
}): Promise<{ rows: AuditLogRow[]; total: number }> {
  const admin = createAdminClient()
  const { tenantId, actionPrefix, page = 1, perPage = 50 } = options ?? {}
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = admin
    .from("audit_logs")
    .select("id, tenant_id, actor_user_id, action, target_type, target_id, metadata, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (tenantId) query = query.eq("tenant_id", tenantId)
  if (actionPrefix) query = query.ilike("action", `${actionPrefix}%`)

  const { data, count } = await query

  const tenantIds = [...new Set((data ?? []).map((r) => r.tenant_id))]
  const actorIds = [...new Set((data ?? []).filter((r) => r.actor_user_id).map((r) => r.actor_user_id as string))]

  const [slugResult, usersResult] = await Promise.all([
    tenantIds.length > 0
      ? admin.from("tenants").select("id, slug").in("id", tenantIds)
      : Promise.resolve({ data: [] }),
    actorIds.length > 0
      ? admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      : Promise.resolve({ data: { users: [] } }),
  ])

  const slugMap = new Map<string, string>()
  for (const t of (slugResult.data ?? []) as { id: string; slug: string }[]) {
    slugMap.set(t.id, t.slug)
  }

  const emailMap = new Map<string, string>()
  for (const u of usersResult.data.users) {
    emailMap.set(u.id, u.email ?? u.id)
  }

  return {
    rows: (data ?? []).map((row) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      tenant_slug: slugMap.get(row.tenant_id) ?? null,
      actor_user_id: row.actor_user_id ?? null,
      actor_email: row.actor_user_id ? (emailMap.get(row.actor_user_id) ?? null) : null,
      action: row.action,
      target_type: row.target_type,
      target_id: row.target_id ?? null,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      created_at: row.created_at,
    })),
    total: count ?? 0,
  }
}

export async function fetchIndexingJobStats(): Promise<{
  rows: IndexingJobRow[]
  counts: Record<string, number>
}> {
  const admin = createAdminClient()
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: recentJobs }, { data: countRows }] = await Promise.all([
    admin
      .from("indexing_jobs")
      .select("id, tenant_id, bot_id, source_id, status, job_type, requested_at, started_at, finished_at, pages_indexed, error_message")
      .order("requested_at", { ascending: false })
      .limit(100),
    admin.from("indexing_jobs").select("status").gte("requested_at", since7d),
  ])

  const counts: Record<string, number> = {}
  for (const row of countRows ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1
  }

  return {
    rows: (recentJobs ?? []) as IndexingJobRow[],
    counts,
  }
}

export async function fetchPlatformTenantDetail(tenantId: string): Promise<PlatformTenantDetail> {
  const { tenants, plans } = await fetchPlatformDashboard()
  const tenant = tenants.find((row) => row.id === tenantId)
  if (!tenant) notFound()

  const admin = createAdminClient()
  const monthStart = (() => {
    const now = new Date()
    const monthStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    return monthStartUtc.toISOString().slice(0, 10)
  })()

  const [{ data: membershipsRaw }, { data: botsRaw }, { data: usageRaw }, usersPage] = await Promise.all([
    admin
      .from("tenant_memberships")
      .select("user_id, role, is_active, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    admin
      .from("bots")
      .select("id, public_id, name, status, is_public, access_mode, force_stopped, force_stop_reason, force_stopped_at, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    admin
      .from("usage_daily")
      .select("messages_count, tokens_out")
      .eq("tenant_id", tenantId)
      .gte("usage_date", monthStart),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const emailMap = new Map<string, string | null>()
  for (const user of usersPage.data.users ?? []) {
    emailMap.set(user.id, user.email ?? null)
  }

  const memberships = ((membershipsRaw ?? []) as Array<{ user_id: string; role: "editor" | "reader"; is_active: boolean; created_at: string }>).map(
    (row) => ({
      ...row,
      user_email: emailMap.get(row.user_id) ?? null,
    })
  )

  const usage30dMessages = (usageRaw ?? []).reduce((sum, row) => sum + Number(row.messages_count ?? 0), 0)
  const usage30dTokensOut = (usageRaw ?? []).reduce((sum, row) => sum + Number(row.tokens_out ?? 0), 0)

  return {
    tenant,
    plans,
    memberships,
    bots: (botsRaw ?? []) as PlatformTenantBot[],
    usage30dMessages,
    usage30dTokensOut,
  }
}
