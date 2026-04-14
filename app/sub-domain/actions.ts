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
  const normalized = email.toLowerCase()
  // Fetch up to 5000 users in blocks of 1000 (Supabase max perPage)
  let page = 1
  while (page <= 5) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const found = data.users.find((user) => (user.email ?? "").toLowerCase() === normalized)
    if (found) return found.id
    if (data.users.length < 1000) break
    page += 1
  }
  return null
}

export async function setTenantActiveAction(formData: FormData) {
  const redirectTo = normalizeRedirectTo(formData.get("redirect_to"))

  try {
    const { admin, userId } = await requirePlatformAdminActionContext()
    const tenantId = String(formData.get("tenant_id") ?? "").trim()
    const active = parseSwitchEnabled(formData.get("active"))

    if (!parseUuid(tenantId)) throw new Error("tenant_id が不正です。")

    const { error } = await admin
      .from("tenants")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", tenantId)

    if (error) throw error

    await writeAuditLog(admin, {
      tenantId,
      action: active ? "platform.tenant.activate" : "platform.tenant.deactivate",
      targetType: "tenant",
      targetId: tenantId,
      after: { active },
      metadata: { actor_user_id: userId },
    })

    revalidatePath("/sub-domain")
    revalidatePath(`/sub-domain/tenants/${tenantId}`)
    redirect(
      `${redirectTo}?notice=${encodeURIComponent(active ? "テナントを有効化しました。" : "テナントを無効化しました。解約処理が完了した場合は Stripe 側の操作も確認してください。")}`
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "テナント有効化状態の更新に失敗しました。"
    redirect(`${redirectTo}?error=${encodeURIComponent(message)}`)
  }
}

export async function createTenantAction(formData: FormData) {
  try {
    const { admin, userId } = await requirePlatformAdminActionContext()
    const displayName = String(formData.get("display_name") ?? "").trim()
    const ownerEmail = String(formData.get("owner_email") ?? "").trim().toLowerCase()
    const slugInput = String(formData.get("slug") ?? "").trim().toLowerCase()
    const planId = Number(formData.get("plan_id") ?? "")
    const billingMode = normalizeBillingMode(String(formData.get("billing_mode") ?? "stripe").trim())
    const setupOverride = String(formData.get("setup_override") ?? "") === "on"
    const notes = String(formData.get("notes") ?? "").trim()

    if (!displayName) throw new Error("display_name は必須です。")
    if (!ownerEmail.includes("@")) throw new Error("有効なオーナーメールアドレスを入力してください。")
    if (setupOverride && (!Number.isFinite(planId) || planId <= 0)) {
      throw new Error("請求形態を設定する場合はプランを選択してください。")
    }

    const ownerId = await findUserIdByEmail(admin, ownerEmail)
    if (!ownerId) throw new Error("該当メールアドレスのユーザーが見つかりません。先にサインアップしてください。")

    const baseSlug = (slugInput || displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")) || "tenant"
    const shortId = Math.random().toString(36).slice(2, 8)
    const slug = `${baseSlug}-${shortId}`

    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({ slug, display_name: displayName, owner_user_id: ownerId })
      .select("id")
      .single()

    if (tenantError) throw tenantError

    const tenantId = tenant.id

    await admin.from("tenant_memberships").upsert(
      { tenant_id: tenantId, user_id: ownerId, role: "editor", is_active: true },
      { onConflict: "tenant_id,user_id" }
    )

    // 請求形態が指定されている場合は Override を自動作成
    if (setupOverride && planId > 0) {
      await admin.from("tenant_contract_overrides").upsert(
        {
          tenant_id: tenantId,
          plan_id: planId,
          status: "active",
          billing_mode: billingMode,
          is_active: true,
          notes: notes || null,
          effective_from: new Date().toISOString(),
          created_by: userId,
          updated_by: userId,
        },
        { onConflict: "tenant_id" }
      )
    }

    await writeAuditLog(admin, {
      tenantId,
      action: "platform.tenant.create",
      targetType: "tenant",
      targetId: tenantId,
      after: { display_name: displayName, slug, owner_user_id: ownerId, billing_mode: setupOverride ? billingMode : null },
      metadata: { actor_user_id: userId },
    })

    revalidatePath("/sub-domain")
    redirect(`/sub-domain/tenants/${tenantId}?notice=${encodeURIComponent("テナントを作成しました。")}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "テナント作成に失敗しました。"
    redirect(`/sub-domain?error=${encodeURIComponent(message)}`)
  }
}

export async function inviteUserToTenantAction(formData: FormData) {
  const redirectTo = normalizeRedirectTo(formData.get("redirect_to"))

  try {
    const { admin, userId } = await requirePlatformAdminActionContext()
    const tenantId = String(formData.get("tenant_id") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim().toLowerCase()
    const role = normalizeMembershipRole(String(formData.get("role") ?? "editor"))

    if (!parseUuid(tenantId)) throw new Error("tenant_id が不正です。")
    if (!email.includes("@")) throw new Error("有効なメールアドレスを入力してください。")

    const { data: tenantRow } = await admin
      .from("tenants")
      .select("display_name")
      .eq("id", tenantId)
      .maybeSingle()

    if (!tenantRow) throw new Error("テナントが見つかりません。")

    // 招待メールを送信（未登録ユーザーならアカウントを作成してメール送信）
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { tenant_id: tenantId },
    })

    if (inviteError) {
      // すでにアカウントがある場合は既存ユーザーIDを検索してメンバーシップだけ付与
      if (inviteError.message.includes("already been registered") || inviteError.code === "email_exists") {
        const existingUserId = await findUserIdByEmail(admin, email)
        if (!existingUserId) throw new Error("招待に失敗しました: " + inviteError.message)

        await admin.from("tenant_memberships").upsert(
          { tenant_id: tenantId, user_id: existingUserId, role, is_active: true },
          { onConflict: "tenant_id,user_id" }
        )

        await writeAuditLog(admin, {
          tenantId,
          action: "platform.tenant.member.invite",
          targetType: "tenant",
          targetId: tenantId,
          after: { email, role, note: "existing_user_membership_granted" },
          metadata: { actor_user_id: userId },
        })

        revalidatePath(`/sub-domain/tenants/${tenantId}`)
        redirect(`${redirectTo}?notice=${encodeURIComponent("既存アカウントにメンバーシップを付与しました。")}`)
      }
      throw inviteError
    }

    const invitedUserId = inviteData.user.id

    // 招待完了後にメンバーシップをあらかじめ登録
    await admin.from("tenant_memberships").upsert(
      { tenant_id: tenantId, user_id: invitedUserId, role, is_active: true },
      { onConflict: "tenant_id,user_id" }
    )

    await writeAuditLog(admin, {
      tenantId,
      action: "platform.tenant.member.invite",
      targetType: "tenant",
      targetId: tenantId,
      after: { email, role, invited_user_id: invitedUserId },
      metadata: { actor_user_id: userId },
    })

    revalidatePath(`/sub-domain/tenants/${tenantId}`)
    redirect(`${redirectTo}?notice=${encodeURIComponent(`${email} に招待メールを送信し、メンバーシップを付与しました。`)}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "招待メールの送信に失敗しました。"
    redirect(`${redirectTo}?error=${encodeURIComponent(message)}`)
  }
}

export async function updatePlanLimitsAction(formData: FormData) {
  try {
    const { admin, role, userId } = await requirePlatformAdminActionContext()
    if (role !== "owner") {
      throw new Error("owner権限が必要です。")
    }

    const planId = Number(formData.get("plan_id") ?? "")
    if (!Number.isFinite(planId) || planId <= 0) throw new Error("plan_id が不正です。")

    const parseNonNegInt = (key: string) => {
      const v = Number(formData.get(key) ?? "")
      if (!Number.isFinite(v) || v < 0) throw new Error(`${key} は0以上の整数を入力してください。`)
      return Math.floor(v)
    }

    const payload = {
      max_bots: parseNonNegInt("max_bots"),
      max_monthly_messages: parseNonNegInt("max_monthly_messages"),
      max_storage_mb: parseNonNegInt("max_storage_mb"),
      max_hosted_pages: parseNonNegInt("max_hosted_pages"),
      internal_max_bots_cap: parseNonNegInt("internal_max_bots_cap"),
      has_api: String(formData.get("has_api") ?? "") === "on",
      has_hosted_page: String(formData.get("has_hosted_page") ?? "") === "on",
    }

    const { data: planRow } = await admin.from("plans").select("code,name").eq("id", planId).maybeSingle()
    if (!planRow) throw new Error("プランが見つかりません。")

    const { error } = await admin.from("plans").update(payload).eq("id", planId)
    if (error) throw error

    // audit_logsはtenant_idが必須のためplatform管理操作として汎用テナントIDを使わず
    // 別途platform audit logに書く（tenant_idはダミーとして書く場合の代わりにskip）
    // 代わりに console audit_log の writeAuditLog を使わず直接insert
    await admin.from("audit_logs").insert({
      tenant_id: "00000000-0000-0000-0000-000000000000",
      actor_user_id: userId,
      action: "platform.plan.limits.update",
      target_type: "plan",
      target_id: String(planId),
      metadata: { plan_code: planRow.code, plan_name: planRow.name, ...payload },
    })

    revalidatePath("/sub-domain/plans")
    redirect(`/sub-domain/plans?notice=${encodeURIComponent(`「${planRow.name}」のリミットを更新しました。`)}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "プランリミット更新に失敗しました。"
    redirect(`/sub-domain/plans?error=${encodeURIComponent(message)}`)
  }
}

export async function clearNotificationAction(formData: FormData) {
  try {
    const { admin } = await requirePlatformAdminActionContext()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) throw new Error("id が不正です。")

    const { error } = await admin
      .from("tenant_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .is("read_at", null)

    if (error) throw error

    revalidatePath("/sub-domain/notifications")
    redirect("/sub-domain/notifications?notice=" + encodeURIComponent("通知を既読にしました。"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "既読化に失敗しました。"
    redirect("/sub-domain/notifications?error=" + encodeURIComponent(message))
  }
}

export async function clearAllNotificationsForTenantAction(formData: FormData) {
  try {
    const { admin } = await requirePlatformAdminActionContext()
    const tenantId = String(formData.get("tenant_id") ?? "").trim()
    if (!parseUuid(tenantId)) throw new Error("tenant_id が不正です。")

    const { error } = await admin
      .from("tenant_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("tenant_id", tenantId)
      .is("read_at", null)

    if (error) throw error

    revalidatePath("/sub-domain/notifications")
    redirect("/sub-domain/notifications?notice=" + encodeURIComponent("テナントの未読通知を全て既読にしました。"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "一括既読化に失敗しました。"
    redirect("/sub-domain/notifications?error=" + encodeURIComponent(message))
  }
}

export async function deleteNotificationAction(formData: FormData) {
  try {
    const { admin } = await requirePlatformAdminActionContext()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) throw new Error("id が不正です。")

    const { error } = await admin.from("tenant_notifications").delete().eq("id", id)
    if (error) throw error

    revalidatePath("/sub-domain/notifications")
    redirect("/sub-domain/notifications?notice=" + encodeURIComponent("通知を削除しました。"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "削除に失敗しました。"
    redirect("/sub-domain/notifications?error=" + encodeURIComponent(message))
  }
}

export async function createPromoCodeAction(formData: FormData) {
  try {
    const { admin } = await requirePlatformAdminActionContext()

    const code = String(formData.get("code") ?? "").trim().toUpperCase()
    const description = String(formData.get("description") ?? "").trim()
    const trialDays = Number(formData.get("trial_days") ?? "14")
    const planCode = String(formData.get("plan_code") ?? "").trim() || null
    const maxUsesRaw = String(formData.get("max_uses") ?? "").trim()
    const maxUses = maxUsesRaw === "" ? null : Number(maxUsesRaw)
    const expiresAtRaw = String(formData.get("expires_at") ?? "").trim()
    const expiresAt = expiresAtRaw || null

    if (!code) throw new Error("コードは必須です。")
    if (!/^[A-Z0-9_-]+$/.test(code)) throw new Error("コードは英数字・ハイフン・アンダースコアのみ使用できます。")
    if (!Number.isFinite(trialDays) || trialDays < 1 || trialDays > 365) {
      throw new Error("トライアル日数は1〜365の整数で入力してください。")
    }
    if (maxUses !== null && (!Number.isFinite(maxUses) || maxUses < 1)) {
      throw new Error("最大使用回数は1以上の整数を入力してください。")
    }

    const { error } = await admin.from("promo_codes").insert({
      code,
      description: description || null,
      trial_days: trialDays,
      plan_code: planCode,
      max_uses: maxUses,
      expires_at: expiresAt,
      is_active: true,
    })

    if (error) {
      if (error.code === "23505") throw new Error(`コード「${code}」はすでに登録されています。`)
      throw error
    }

    revalidatePath("/sub-domain/promo-codes")
    redirect(`/sub-domain/promo-codes?notice=${encodeURIComponent(`コード「${code}」を作成しました。`)}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "招待コードの作成に失敗しました。"
    redirect(`/sub-domain/promo-codes?error=${encodeURIComponent(message)}`)
  }
}

export async function togglePromoCodeActiveAction(formData: FormData) {
  try {
    const { admin } = await requirePlatformAdminActionContext()

    const id = String(formData.get("id") ?? "").trim()
    const isActive = String(formData.get("is_active") ?? "") === "true"

    if (!id) throw new Error("id が不正です。")

    const { error } = await admin
      .from("promo_codes")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/sub-domain/promo-codes")
    redirect(`/sub-domain/promo-codes?notice=${encodeURIComponent(isActive ? "コードを有効化しました。" : "コードを無効化しました。")}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "状態の更新に失敗しました。"
    redirect(`/sub-domain/promo-codes?error=${encodeURIComponent(message)}`)
  }
}

export async function deletePromoCodeAction(formData: FormData) {
  try {
    const { admin } = await requirePlatformAdminActionContext()

    const id = String(formData.get("id") ?? "").trim()
    if (!id) throw new Error("id が不正です。")

    const { error } = await admin.from("promo_codes").delete().eq("id", id)
    if (error) throw error

    revalidatePath("/sub-domain/promo-codes")
    redirect(`/sub-domain/promo-codes?notice=${encodeURIComponent("コードを削除しました。")}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : "削除に失敗しました。"
    redirect(`/sub-domain/promo-codes?error=${encodeURIComponent(message)}`)
  }
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
