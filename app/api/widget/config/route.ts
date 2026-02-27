import crypto from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

import { getAppUrl } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

function withCors(response: NextResponse, origin: string | null) {
  response.headers.set("Access-Control-Allow-Origin", origin ?? "*")
  response.headers.set("Vary", "Origin")
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type")
  return response
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin")
  return withCors(new NextResponse(null, { status: 204 }), origin)
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin")
  const botPublicId = request.nextUrl.searchParams.get("botPublicId")?.trim()
  const widgetToken = request.nextUrl.searchParams.get("widgetToken")?.trim()

  if (!botPublicId || !widgetToken) {
    return withCors(
      NextResponse.json({ error: "botPublicId and widgetToken are required" }, { status: 400 }),
      origin
    )
  }

  const admin = createAdminClient()
  const { data: bot } = await admin
    .from("bots")
    .select(
      "id, tenant_id, public_id, status, is_public, access_mode, require_auth_for_hosted, force_stopped, force_stop_reason, widget_enabled, widget_mode, widget_position, widget_launcher_label, widget_policy_text, widget_redirect_new_tab"
    )
    .eq("public_id", botPublicId)
    .maybeSingle()

  if (!bot) {
    return withCors(NextResponse.json({ error: "bot not found" }, { status: 404 }), origin)
  }

  const { data: tenantRow } = await admin
    .from("tenants")
    .select("id, force_stopped, force_stop_reason")
    .eq("id", bot.tenant_id)
    .maybeSingle()

  if (tenantRow?.force_stopped) {
    return withCors(NextResponse.json({ error: tenantRow.force_stop_reason ?? "tenant is force-stopped" }, { status: 423 }), origin)
  }

  if (bot.force_stopped) {
    return withCors(NextResponse.json({ error: bot.force_stop_reason ?? "bot is force-stopped" }, { status: 423 }), origin)
  }
  if (bot.status !== "ready" && bot.status !== "running") {
    return withCors(NextResponse.json({ error: "bot is not ready" }, { status: 409 }), origin)
  }

  if (!bot.is_public) {
    return withCors(NextResponse.json({ error: "bot is not public" }, { status: 403 }), origin)
  }

  const requiresInternal = bot.access_mode === "internal" || Boolean(bot.require_auth_for_hosted)
  if (requiresInternal) {
    return withCors(NextResponse.json({ error: "widget unavailable for internal mode" }, { status: 403 }), origin)
  }

  if (!Boolean(bot.widget_enabled ?? true)) {
    return withCors(NextResponse.json({ error: "widget is disabled" }, { status: 403 }), origin)
  }

  const tokenHash = sha256(widgetToken)
  const { data: tokenRow } = await admin
    .from("bot_public_tokens")
    .select("allowed_origins")
    .eq("bot_id", bot.id)
    .eq("public_token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle()

  if (!tokenRow) {
    return withCors(NextResponse.json({ error: "invalid widget token" }, { status: 401 }), origin)
  }

  const allowedOrigins = (tokenRow.allowed_origins ?? []) as string[]
  if (allowedOrigins.length > 0 && origin && !allowedOrigins.includes(origin)) {
    return withCors(NextResponse.json({ error: "origin not allowed" }, { status: 403 }), origin)
  }

  const appUrl = getAppUrl().replace(/\/$/, "")

  return withCors(
    NextResponse.json({
      botPublicId: bot.public_id,
      hostedUrl: `${appUrl}/chat-by-knotic/${bot.public_id}`,
      embedUrl: `${appUrl}/chat-by-knotic/${bot.public_id}?embed=1&widgetToken=${encodeURIComponent(widgetToken)}`,
      mode: bot.widget_mode ?? "overlay",
      position: bot.widget_position ?? "right-bottom",
      launcherLabel: bot.widget_launcher_label ?? "チャット",
      policyText:
        bot.widget_policy_text ??
        "このチャット履歴はブラウザ上で24時間保持され、自動的に削除されます。",
      redirectNewTab: Boolean(bot.widget_redirect_new_tab ?? false),
    }),
    origin
  )
}

