"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { writeAuditLog } from "@/app/console/_lib/audit"
import {
  IMPERSONATION_COOKIE_NAME,
  createImpersonationToken,
  parseImpersonationToken,
} from "@/lib/impersonation"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type PlatformAdminRole = "owner" | "staff"
type MembershipRole = "editor" | "reader"
type BillingMode = "stripe" | "bank_transfer" | "invoice" | "manual"

type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "paused"
  | "incomplete"

async function requirePlatformAdminActionContext() {
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
    throw new Error("platform_admin権限が必要です。")
  }

  return {
    userId: user.id,
    role: adminRow.role as PlatformAdminRole,
    admin: createAdminClient(),
  }
}

function normalizeRedirectTo(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "")
  if (!value.startsWith("/sub-domain") && !value.startsWith("/console")) return "/sub-domain"
  return value
}

function normalizeMembershipRole(raw: string): MembershipRole {
  return raw === "reader" ? "reader" : "editor"
}

function normalizeBillingMode(raw: string): BillingMode {
  if (raw === "bank_transfer" || raw === "invoice" || raw === "manual") return raw
  return "stripe"
}

function normalizeSubscriptionStatus(raw: string): SubscriptionStatus {
  const allowed: SubscriptionStatus[] = [
    "trialing",
    "active",
    "past_due",
    "unpaid",
    "canceled",
    "paused",
    "incomplete",
  ]
  return allowed.includes(raw as SubscriptionStatus) ? (raw as SubscriptionStatus) : "active"
}

function parseUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function parseSwitchEnabled(value: FormDataEntryValue | null) {
  return String(value ?? "") === "on"
}

export async function startImpersonationAction(formData: FormData) {
  const redirectTo = normalizeRedirectTo(formData.get("redirect_to"))

  try {
    const { admin, userId } = await requirePlatformAdminActionContext()
    const tenantId = String(formData.get("tenant_id") ?? "").trim()

    if (!parseUuid(tenantId)) throw new Error("tenant_id が不正です。")

    const { data: tenant } = await admin
      .from("tenants")
      .select("id")
      .eq("id", tenantId)
      .maybeSingle()

    if (!tenant) throw new Error("tenantが見つかりません。")

    const token = createImpersonationToken({
      tenantId,
      actorUserId: userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    })

    const cookieStore = await cookies()
    cookieStore.set(IMPERSONATION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    })

    await writeAuditLog(admin, {
      tenantId,
      action: "platform.impersonation.start",
      targetType: "tenant",
      targetId: tenantId,
      metadata: { actor_user_id: userId, mode: "read_only" },
    })

    redirect(`/console/overview?notice=${encodeURIComponent("代理閲覧モードを開始しました（読み取り専用）。")}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "代理閲覧の開始に失敗しました。"
    redirect(`${redirectTo}?error=${encodeURIComponent(message)}`)
  }
}

export async function stopImpersonationAction(formData: FormData) {
  const redirectTo = normalizeRedirectTo(formData.get("redirect_to"))

  try {
    const { admin, userId } = await requirePlatformAdminActionContext()
    const cookieStore = await cookies()
    const current = parseImpersonationToken(cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value)
    cookieStore.delete(IMPERSONATION_COOKIE_NAME)

    if (current?.tenantId) {
      await writeAuditLog(admin, {
        tenantId: current.tenantId,
        action: "platform.impersonation.stop",
        targetType: "tenant",
        targetId: current.tenantId,
        metadata: { actor_user_id: userId },
      })
    }

    if (redirectTo.startsWith("/console")) {
      redirect(`${redirectTo}?notice=${encodeURIComponent("代理閲覧モードを終了しました。")}`)
    }
    redirect(`${redirectTo}?notice=${encodeURIComponent("代理閲覧モードを終了しました。")}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "代理閲覧の終了に失敗しました。"
    redirect(`${redirectTo}?error=${encodeURIComponent(message)}`)
  }
}

export async function setTenantForceStopAction(formData: FormData) {
  const redirectTo = normalizeRedirectTo(formData.get("redirect_to"))

  try {
    const { admin, userId } = await requirePlatformAdminActionContext()
    const tenantId = String(formData.get("tenant_id") ?? "").trim()
    const enabled = parseSwitchEnabled(formData.get("enabled"))
    const reason = String(formData.get("reason") ?? "").trim()

    if (!parseUuid(tenantId)) throw new Error("tenant_id が不正です。")

    const payload = enabled
      ? {
          force_stopped: true,
          force_stop_reason: reason || "platform emergency stop",
          force_stopped_at: new Date().toISOString(),
          force_stopped_by: userId,
        }
      : {
          force_stopped: false,
          force_stop_reason: null,
          force_stopped_at: null,
          force_stopped_by: null,
        }

    const { error } = await admin.from("tenants").update(payload).eq("id", tenantId)
    if (error) throw error

    await writeAuditLog(admin, {
      tenantId,
      action: enabled ? "platform.tenant.force_stop.enable" : "platform.tenant.force_stop.disable",
      targetType: "tenant",
      targetId: tenantId,
      after: payload,
    })

    revalidatePath("/sub-domain")
    revalidatePath(`/sub-domain/tenants/${tenantId}`)
    redirect(`${redirectTo}?notice=${encodeURIComponent(enabled ? "テナント強制停止を有効化しました。" : "テナント強制停止を解除しました。")}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "テナント強制停止の更新に失敗しました。"
    redirect(`${redirectTo}?error=${encodeURIComponent(message)}`)
  }
}

export async function setBotForceStopAction(formData: FormData) {
  const redirectTo = normalizeRedirectTo(formData.get("redirect_to"))

  try {
    const { admin, userId } = await requirePlatformAdminActionContext()
    const tenantId = String(formData.get("tenant_id") ?? "").trim()
    const botId = String(formData.get("bot_id") ?? "").trim()
    const enabled = parseSwitchEnabled(formData.get("enabled"))
    const reason = String(formData.get("reason") ?? "").trim()

    if (!parseUuid(tenantId) || !parseUuid(botId)) throw new Error("tenant_id/bot_id が不正です。")

    const payload = enabled
      ? {
          force_stopped: true,
          force_stop_reason: reason || "platform emergency stop",
          force_stopped_at: new Date().toISOString(),
          force_stopped_by: userId,
        }
      : {
          force_stopped: false,
          force_stop_reason: null,
          force_stopped_at: null,
          force_stopped_by: null,
        }

    const { error } = await admin.from("bots").update(payload).eq("id", botId).eq("tenant_id", tenantId)
    if (error) throw error

    await writeAuditLog(admin, {
      tenantId,
      action: enabled ? "platform.bot.force_stop.enable" : "platform.bot.force_stop.disable",
      targetType: "bot",
      targetId: botId,
      after: payload,
    })

    revalidatePath("/sub-domain")
    revalidatePath(`/sub-domain/tenants/${tenantId}`)
    redirect(`${redirectTo}?notice=${encodeURIComponent(enabled ? "Bot強制停止を有効化しました。" : "Bot強制停止を解除しました。")}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bot強制停止の更新に失敗しました。"
    redirect(`${redirectTo}?error=${encodeURIComponent(message)}`)
  }
}

export async function upsertContractOverrideAction(formData: FormData) {
  const redirectTo = normalizeRedirectTo(formData.get("redirect_to"))

  try {
    const { admin, userId } = await requirePlatformAdminActionContext()
    const tenantId = String(formData.get("tenant_id") ?? "").trim()
    const planId = Number(formData.get("plan_id") ?? "")
    const status = normalizeSubscriptionStatus(String(formData.get("status") ?? "active").trim())
    const billingMode = normalizeBillingMode(String(formData.get("billing_mode") ?? "stripe").trim())
    const isActive = String(formData.get("is_active") ?? "") === "on"
    const notes = String(formData.get("notes") ?? "").trim()
    const effectiveFrom = String(formData.get("effective_from") ?? "").trim()
    const effectiveUntil = String(formData.get("effective_until") ?? "").trim()

    if (!parseUuid(tenantId)) {
      throw new Error("tenant_id が不正です。")
    }
    if (!Number.isFinite(planId) || planId <= 0) {
      throw new Error("plan_id を選択してください。")
    }

    const payload = {
      tenant_id: tenantId,
      plan_id: planId,
      status,
      billing_mode: billingMode,
      is_active: isActive,
      notes: notes || null,
      effective_from: effectiveFrom || new Date().toISOString(),
      effective_until: effectiveUntil || null,
      updated_by: userId,
      created_by: userId,
    }

    const { error } = await admin
      .from("tenant_contract_overrides")
      .upsert(payload, { onConflict: "tenant_id" })

    if (error) throw error

    revalidatePath("/sub-domain")
    redirect(`${redirectTo}?notice=契約オーバーライドを更新しました。`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "契約オーバーライド更新に失敗しました。"
    redirect(`${redirectTo}?error=${encodeURIComponent(message)}`)
  }
}

export async function disableContractOverrideAction(formData: FormData) {
  const redirectTo = normalizeRedirectTo(formData.get("redirect_to"))

  try {
    const { admin, role, userId } = await requirePlatformAdminActionContext()
    if (role !== "owner") {
      throw new Error("owner権限が必要です。")
    }

    const tenantId = String(formData.get("tenant_id") ?? "").trim()
    if (!parseUuid(tenantId)) throw new Error("tenant_id が不正です。")

    const { error } = await admin
      .from("tenant_contract_overrides")
      .update({ is_active: false, updated_by: userId, effective_until: new Date().toISOString() })
      .eq("tenant_id", tenantId)

    if (error) throw error

    revalidatePath("/sub-domain")
    redirect(`${redirectTo}?notice=契約オーバーライドを無効化しました。`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "契約オーバーライド無効化に失敗しました。"
    redirect(`${redirectTo}?error=${encodeURIComponent(message)}`)
  }
}

async function findUserIdByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  let page = 1
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const found = data.users.find((user) => (user.email ?? "").toLowerCase() === email.toLowerCase())
    if (found) return found.id
    if (!data.users.length) break
    page += 1
  }
  return null
}

export async function upsertTenantMembershipAction(formData: FormData) {
  const redirectTo = normalizeRedirectTo(formData.get("redirect_to"))

  try {
    const { admin } = await requirePlatformAdminActionContext()
    const tenantId = String(formData.get("tenant_id") ?? "").trim()
    const userEmail = String(formData.get("user_email") ?? "").trim().toLowerCase()
    const role = normalizeMembershipRole(String(formData.get("role") ?? "editor"))
    const isActive = String(formData.get("is_active") ?? "") === "on"

    if (!parseUuid(tenantId)) throw new Error("tenant_id が不正です。")
    if (!userEmail.includes("@")) throw new Error("有効なメールアドレスを入力してください。")

    const userId = await findUserIdByEmail(admin, userEmail)
    if (!userId) {
      throw new Error("該当メールアドレスのユーザーが見つかりません。先にサインアップしてください。")
    }

    const { error } = await admin.from("tenant_memberships").upsert(
      {
        tenant_id: tenantId,
        user_id: userId,
        role,
        is_active: isActive,
      },
      { onConflict: "tenant_id,user_id" }
    )

    if (error) throw error

    revalidatePath("/sub-domain")
    redirect(`${redirectTo}?notice=契約者ユーザー権限を更新しました。`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "契約者ユーザー権限の更新に失敗しました。"
    redirect(`${redirectTo}?error=${encodeURIComponent(message)}`)
  }
}
