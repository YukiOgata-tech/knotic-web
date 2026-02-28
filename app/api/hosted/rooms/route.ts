import { NextRequest, NextResponse } from "next/server"

import { requireHostedMemberContext } from "@/lib/hosted/access"
import { createAdminClient } from "@/lib/supabase/admin"

function toErrorStatus(message: string) {
  if (message === "authentication_required") return 401
  if (message === "membership_required") return 403
  if (message === "bot_not_found") return 404
  if (message === "bot_not_ready") return 409
  if (message === "internal_mode_required") return 400
  return 400
}

export async function GET(request: NextRequest) {
  try {
    const botPublicId = request.nextUrl.searchParams.get("botPublicId")?.trim()
    if (!botPublicId) {
      return NextResponse.json({ error: "botPublicId is required" }, { status: 400 })
    }

    const { bot, user } = await requireHostedMemberContext(botPublicId)
    const admin = createAdminClient()

    const { data: rooms, error } = await admin
      .from("hosted_chat_rooms")
      .select("id, title, last_message_at, updated_at, created_at")
      .eq("tenant_id", bot.tenant_id)
      .eq("bot_id", bot.id)
      .eq("owner_user_id", user.id)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .limit(100)

    if (error) throw error
    return NextResponse.json({ rooms: rooms ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed"
    return NextResponse.json({ error: message }, { status: toErrorStatus(message) })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      botPublicId?: string
      title?: string
    }
    const botPublicId = body.botPublicId?.trim()
    if (!botPublicId) {
      return NextResponse.json({ error: "botPublicId is required" }, { status: 400 })
    }

    const { bot, user } = await requireHostedMemberContext(botPublicId)
    const admin = createAdminClient()
    const title = body.title?.trim() || "新しいチャット"

    const { data, error } = await admin
      .from("hosted_chat_rooms")
      .insert({
        tenant_id: bot.tenant_id,
        bot_id: bot.id,
        owner_user_id: user.id,
        title: title.slice(0, 120),
      })
      .select("id, title, last_message_at, updated_at, created_at")
      .single()

    if (error) throw error
    return NextResponse.json({ room: data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed"
    return NextResponse.json({ error: message }, { status: toErrorStatus(message) })
  }
}
