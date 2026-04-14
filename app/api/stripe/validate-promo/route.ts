import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get("code") ?? "").trim().toUpperCase()

  if (!code) {
    return NextResponse.json({ valid: false, message: "コードを入力してください。" })
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from("promo_codes")
    .select("trial_days, max_uses, used_count, expires_at, is_active, plan_code")
    .eq("code", code)
    .maybeSingle()

  if (!data || !data.is_active) {
    return NextResponse.json({ valid: false, message: "無効なコードです。" })
  }

  if (data.expires_at && new Date(String(data.expires_at)) <= new Date()) {
    return NextResponse.json({ valid: false, message: "このコードは有効期限が切れています。" })
  }

  if (data.max_uses !== null && Number(data.used_count) >= Number(data.max_uses)) {
    return NextResponse.json({ valid: false, message: "このコードは使用上限に達しています。" })
  }

  const trialDays = Number(data.trial_days)
  return NextResponse.json({
    valid: true,
    trialDays,
    planCode: data.plan_code ?? null,
    message: `${trialDays}日間の無料トライアルが適用されます。`,
  })
}
