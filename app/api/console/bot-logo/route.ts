import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("logo") as File | null
  const botId = formData.get("bot_id") as string | null

  if (!file || !botId) return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 })

  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  if (!membership || membership.role !== "editor")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const admin = createAdminClient()
  const { data: bot } = await admin
    .from("bots")
    .select("id")
    .eq("id", botId)
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle()

  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png"
  const path = `${botId}/logo.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from("bot-logos")
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const {
    data: { publicUrl },
  } = admin.storage.from("bot-logos").getPublicUrl(path)

  return NextResponse.json({ publicUrl })
}
