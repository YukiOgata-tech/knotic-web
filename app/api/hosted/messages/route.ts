import { NextRequest, NextResponse } from "next/server"

import { requireHostedMemberContext } from "@/lib/hosted/access"
import { createAdminClient } from "@/lib/supabase/admin"

function toErrorStatus(message: string) {
  if (message === "authentication_required") return 401
  if (message === "membership_required") return 403
  if (message === "bot_not_found") return 404
  if (message === "bot_not_ready") return 409
  if (message === "internal_mode_required") return 400
  if (message === "room_not_found") return 404
  return 400
}

export async function GET(request: NextRequest) {
  try {
    const botPublicId = request.nextUrl.searchParams.get("botPublicId")?.trim()
    const roomId = request.nextUrl.searchParams.get("roomId")?.trim()
    if (!botPublicId || !roomId) {
      return NextResponse.json({ error: "botPublicId and roomId are required" }, { status: 400 })
    }

    const { bot, user } = await requireHostedMemberContext(botPublicId)
    const admin = createAdminClient()

    const { data: room } = await admin
      .from("hosted_chat_rooms")
      .select("id")
      .eq("id", roomId)
      .eq("tenant_id", bot.tenant_id)
      .eq("bot_id", bot.id)
      .eq("owner_user_id", user.id)
      .maybeSingle()

    if (!room) {
      return NextResponse.json({ error: "room_not_found" }, { status: 404 })
    }

    const { data: messages, error } = await admin
      .from("hosted_chat_messages")
      .select("id, role, content, citations, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(300)

    if (error) throw error
    return NextResponse.json({ messages: messages ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed"
    return NextResponse.json({ error: message }, { status: toErrorStatus(message) })
  }
}
