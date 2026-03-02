import { createAdminClient } from "@/lib/supabase/admin"

export type AuditLogInput = {
  tenantId: string
  action: string
  targetType: string
  targetId?: string | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

export type AuditLogResult = {
  ok: boolean
  via: "rpc" | "admin_fallback" | "failed"
  id?: string | null
  error?: string
}

function shouldDebugLogAudit() {
  return process.env.AUDIT_DEBUG_LOG === "true" || process.env.NODE_ENV !== "production"
}

export async function writeAuditLog(
  supabase: {
    rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>
    auth?: { getUser?: () => Promise<{ data?: { user?: { id?: string | null } | null } }> }
  } | any,
  input: AuditLogInput
) {
  const payload = {
    p_tenant_id: input.tenantId,
    p_action: input.action,
    p_target_type: input.targetType,
    p_target_id: input.targetId ?? null,
    p_before: input.before ?? {},
    p_after: input.after ?? {},
    p_metadata: input.metadata ?? {},
  }

  try {
    const { data, error } = await supabase.rpc("write_audit_log", payload)

    if (!error) {
      if (shouldDebugLogAudit()) {
        console.info("[audit] write_audit_log ok (rpc)", {
          action: input.action,
          tenantId: input.tenantId,
          targetType: input.targetType,
          targetId: input.targetId ?? null,
          id: typeof data === "string" ? data : null,
        })
      }
      return { ok: true, via: "rpc", id: typeof data === "string" ? data : null } satisfies AuditLogResult
    }

    if (shouldDebugLogAudit()) {
      console.warn("[audit] write_audit_log rpc failed, fallback to admin insert:", error.message ?? error)
    }

    const admin = createAdminClient()
    const authResult = await supabase.auth?.getUser?.().catch(() => null)
    const actorUserId = authResult?.data?.user?.id ?? null

    const { data: inserted, error: insertError } = await admin
      .from("audit_logs")
      .insert({
        tenant_id: input.tenantId,
        actor_user_id: actorUserId,
        action: input.action,
        target_type: input.targetType,
        target_id: input.targetId ?? null,
        before_json: input.before ?? {},
        after_json: input.after ?? {},
        metadata: input.metadata ?? {},
      })
      .select("id")
      .single()

    if (!insertError) {
      if (shouldDebugLogAudit()) {
        console.info("[audit] write_audit_log ok (admin_fallback)", {
          action: input.action,
          tenantId: input.tenantId,
          targetType: input.targetType,
          targetId: input.targetId ?? null,
          id: inserted?.id ?? null,
        })
      }
      return { ok: true, via: "admin_fallback", id: inserted?.id ?? null } satisfies AuditLogResult
    }

    const failed = insertError.message ?? "unknown error"
    console.warn("[audit] write_audit_log admin_fallback failed:", failed)
    return { ok: false, via: "failed", error: failed } satisfies AuditLogResult
  } catch (error) {
    console.warn("[audit] write_audit_log exception:", error)
    return {
      ok: false,
      via: "failed",
      error: error instanceof Error ? error.message : "unknown exception",
    } satisfies AuditLogResult
  }
}
