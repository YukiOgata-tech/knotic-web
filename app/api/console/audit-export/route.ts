import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const EXPORT_LIMIT = 5000

// Action label map (mirrors audit-log-list.tsx)
const ACTION_LABELS: Record<string, string> = {
  "bot.create": "Bot作成",
  "bot.public.toggle": "Bot公開設定変更",
  "bot.identity.update": "Bot情報更新",
  "bot.hosted_config.update": "Hosted設定更新",
  "source.url.add": "URLソース追加",
  "source.pdf.add": "PDFソース追加",
  "indexing.queue": "ナレッジ読み込み登録",
  "widget.token.rotate": "Widgetトークン再発行",
  "widget.allowed_origins.update": "Widget許可オリジン更新",
  "api_key.create": "APIキー発行",
  "api_key.revoke": "APIキー失効",
  "tenant.create": "テナント作成",
  "tenant.profile.update": "テナント情報更新",
  "tenant.ai_settings.update": "AI設定更新",
  "tenant.member.invite.create": "メンバー招待",
  "tenant.member.invite.revoke": "招待取り消し",
  "auth.email.update.requested": "メールアドレス変更申請",
  "auth.password.updated": "パスワード変更",
  "audit.test.write": "監査ログテスト",
  "platform.impersonation.start": "閲覧モード開始（管理者）",
  "platform.impersonation.stop": "閲覧モード終了（管理者）",
  "platform.tenant.force_stop.enable": "テナント強制停止（管理者）",
  "platform.tenant.force_stop.disable": "テナント強制停止解除（管理者）",
  "platform.bot.force_stop.enable": "Bot強制停止（管理者）",
  "platform.bot.force_stop.disable": "Bot強制停止解除（管理者）",
}

type AuditRow = {
  id: string
  created_at: string
  action: string
  target_type: string | null
  target_id: string | null
  actor_user_id: string | null
  after_json: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function toCSV(rows: AuditRow[]): string {
  const headers = ["日時", "アクション", "アクション名", "対象種別", "対象ID", "操作者ID", "詳細"]
  const lines = rows.map((row) => {
    const detail = row.after_json ?? row.metadata ?? {}
    return [
      row.created_at,
      row.action,
      ACTION_LABELS[row.action] ?? "",
      row.target_type ?? "",
      row.target_id ?? "",
      row.actor_user_id ?? "",
      JSON.stringify(detail),
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  })
  // BOM for Excel/Japanese compatibility
  return "\uFEFF" + [headers.map(csvEscape).join(","), ...lines].join("\r\n")
}

export async function GET(request: NextRequest) {
  // Auth: verify session via cookie
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // Resolve tenant from membership (admin client to bypass RLS safely)
  const admin = createAdminClient()
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .single()

  if (!membership) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  // Query params
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action") || undefined
  const targetType = searchParams.get("target_type") || undefined
  const dateFrom = searchParams.get("date_from") || undefined
  const dateTo = searchParams.get("date_to") || undefined

  let query = admin
    .from("audit_logs")
    .select("id, created_at, action, target_type, target_id, actor_user_id, after_json, metadata")
    .eq("tenant_id", membership.tenant_id)
    .order("created_at", { ascending: false })
    .limit(EXPORT_LIMIT)

  if (action) query = query.eq("action", action)
  if (targetType) query = query.eq("target_type", targetType)
  if (dateFrom) query = query.gte("created_at", dateFrom)
  if (dateTo) query = query.lte("created_at", dateTo)

  const { data: rows, error } = await query
  if (error) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 })
  }

  const csv = toCSV((rows ?? []) as AuditRow[])
  const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
