import crypto from "node:crypto"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { PageFrame } from "@/components/marketing/page-frame"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buildMarketingMetadata } from "@/lib/seo/metadata"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = buildMarketingMetadata({
  title: "テナント招待",
  description: "knoticテナント招待の受諾ページです。",
  path: "/invite",
  noIndex: true,
})

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export default async function InvitePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const token = firstParam(params.token)?.trim() ?? ""

  if (!token) {
    return (
      <PageFrame eyebrow="Invite" title="招待リンクが無効です" description="URLに招待トークンが含まれていません。">
        <Card>
          <CardHeader>
            <CardTitle>招待リンクエラー</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            管理者から発行された最新の招待リンクで再度アクセスしてください。
          </CardContent>
        </Card>
      </PageFrame>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite?token=${token}`)}`)
  }

  const userEmail = user.email?.trim().toLowerCase()
  if (!userEmail) {
    return (
      <PageFrame eyebrow="Invite" title="メールアドレスが確認できません" description="アカウント情報を確認してください。">
        <Card>
          <CardHeader>
            <CardTitle>参加できません</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            ログイン中アカウントのメールアドレス取得に失敗しました。
          </CardContent>
        </Card>
      </PageFrame>
    )
  }

  const admin = createAdminClient()
  const tokenHash = hashToken(token)
  const { data: invite } = await admin
    .from("tenant_member_invites")
    .select("id, tenant_id, email, role, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (!invite) {
    return (
      <PageFrame eyebrow="Invite" title="招待リンクが見つかりません" description="リンクが期限切れか、すでに無効化されています。">
        <Card>
          <CardHeader>
            <CardTitle>招待リンクエラー</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            管理者に再招待を依頼してください。
          </CardContent>
        </Card>
      </PageFrame>
    )
  }

  const expired = new Date(invite.expires_at).getTime() <= Date.now()
  if (invite.status !== "pending" || expired) {
    await admin
      .from("tenant_member_invites")
      .update({ status: "expired" })
      .eq("id", invite.id)
      .eq("status", "pending")

    return (
      <PageFrame eyebrow="Invite" title="招待リンクの有効期限切れ" description="招待の有効期限が切れています。">
        <Card>
          <CardHeader>
            <CardTitle>期限切れ</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            管理者に新しい招待リンクを依頼してください。
          </CardContent>
        </Card>
      </PageFrame>
    )
  }

  if (invite.email.trim().toLowerCase() !== userEmail) {
    return (
      <PageFrame eyebrow="Invite" title="招待メールアドレスが一致しません" description="招待先メールアドレスでログインしてください。">
        <Card>
          <CardHeader>
            <CardTitle>メール不一致</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            招待先: {invite.email}
          </CardContent>
        </Card>
      </PageFrame>
    )
  }

  await admin.from("tenant_memberships").upsert(
    {
      tenant_id: invite.tenant_id,
      user_id: user.id,
      role: invite.role,
      is_active: true,
    },
    { onConflict: "tenant_id,user_id" }
  )

  await admin
    .from("tenant_member_invites")
    .update({
      status: "accepted",
      accepted_by: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id)

  await admin
    .from("profiles")
    .update({ default_tenant_id: invite.tenant_id })
    .eq("user_id", user.id)
    .is("default_tenant_id", null)

  redirect("/console/overview?notice=テナント招待を受諾しました。")
}
