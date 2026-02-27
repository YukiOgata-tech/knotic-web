export type AuditLogInput = {
  tenantId: string
  action: string
  targetType: string
  targetId?: string | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

export async function writeAuditLog(
  supabase: { rpc: (fn: string, args?: Record<string, unknown>) => { then: Function } } | any,
  input: AuditLogInput
) {
  try {
    const { error } = await supabase.rpc("write_audit_log", {
      p_tenant_id: input.tenantId,
      p_action: input.action,
      p_target_type: input.targetType,
      p_target_id: input.targetId ?? null,
      p_before: input.before ?? {},
      p_after: input.after ?? {},
      p_metadata: input.metadata ?? {},
    })

    if (error) {
      console.warn("[audit] write_audit_log failed:", error.message ?? error)
    }
  } catch (error) {
    console.warn("[audit] write_audit_log exception:", error)
  }
}
