import { redirect } from "next/navigation"

import { HostedChatClient } from "@/app/chat-by-knotic/[public_id]/hosted-chat-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { assertTenantCanUseHostedPage } from "@/lib/billing/limits"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type PageProps = {
  params: Promise<{ public_id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const PURPOSE_LABEL: Record<string, string> = {
  customer_support: "お問い合わせ対応",
  lead_gen: "資料請求・商談導線",
  internal_kb: "社内ナレッジ",
  onboarding: "導入ガイド",
  custom: "カスタム",
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function HostedBotPage({ params, searchParams }: PageProps) {
  const { public_id } = await params
  const query = (await searchParams) ?? {}
  const widgetToken = firstParam(query.widgetToken)
  const embedded = ["1", "true", "yes"].includes((firstParam(query.embed) ?? "").toLowerCase())
  const previewMode = ["1", "true", "yes"].includes((firstParam(query.preview) ?? "").toLowerCase())

  const admin = createAdminClient()

  const { data: bot } = await admin
    .from("bots")
    .select(
      "id, tenant_id, name, public_id, status, is_public, chat_purpose, access_mode, display_name, welcome_message, placeholder_text, disclaimer_text, show_citations, history_turn_limit, require_auth_for_hosted, force_stopped, force_stop_reason, ui_header_bg_color, ui_header_text_color, ui_footer_bg_color, ui_footer_text_color, faq_questions, bot_logo_url"
    )
    .eq("public_id", public_id)
    .maybeSingle()

  if (!bot) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>ページが見つかりません</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            指定されたチャットボットは存在しないか、公開されていません。
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: tenantRow } = await admin
    .from("tenants")
    .select("id, force_stopped, force_stop_reason")
    .eq("id", bot.tenant_id)
    .maybeSingle()

  if (tenantRow?.force_stopped || bot.force_stopped) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>現在は停止中です</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {tenantRow?.force_stop_reason ?? bot.force_stop_reason ?? "運営側の操作により一時停止しています。"}
          </CardContent>
        </Card>
      </div>
    )
  }

  // プレビューモード: テナントメンバーなら is_public・quota チェックをバイパス
  let isPreviewMember = false
  if (previewMode) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: membership } = await admin
        .from("tenant_memberships")
        .select("tenant_id")
        .eq("tenant_id", bot.tenant_id)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle()
      isPreviewMember = Boolean(membership)
    }
  }

  const requiresInternal = bot.access_mode === "internal" || Boolean(bot.require_auth_for_hosted)

  if (requiresInternal) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect(`/login?next=/chat-by-knotic/${public_id}`)
    }

    const { data: membership } = await admin
      .from("tenant_memberships")
      .select("tenant_id")
      .eq("tenant_id", bot.tenant_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle()

    if (!membership) {
      return (
        <div className="mx-auto w-full max-w-2xl px-4 py-16">
          <Card>
            <CardHeader>
              <CardTitle>アクセス権限がありません</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              このチャットは社内限定です。管理者にアクセス権をご確認ください。
            </CardContent>
          </Card>
        </div>
      )
    }
  } else {
    if (!bot.is_public && !isPreviewMember) {
      return (
        <div className="mx-auto w-full max-w-2xl px-4 py-16">
          <Card>
            <CardHeader>
              <CardTitle>現在は公開停止中です</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              このチャットは現在、公開設定が無効です。
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  if (bot.status !== "ready" && bot.status !== "running") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>準備中</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            ナレッジの準備中です。しばらくしてから再度お試しください。
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isPreviewMember) {
    try {
      await assertTenantCanUseHostedPage(bot.tenant_id, bot.id)
    } catch (error) {
      return (
        <div className="mx-auto w-full max-w-2xl px-4 py-16">
          <Card>
            <CardHeader>
              <CardTitle>Hosted URLは現在利用できません</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "契約プランまたは上限設定によりHosted URLの利用が制限されています。"}
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  return (
    <div className={embedded ? "h-screen w-screen bg-transparent p-2" : "min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_35%,#fffaf3_100%)] px-3 py-4 dark:bg-[linear-gradient(180deg,#0f172a_0%,#0b1220_45%,#0a0f1a_100%)] sm:px-6 sm:py-8"}>
      {isPreviewMember && (
        <div className="mx-auto mb-3 flex max-w-4xl items-center gap-2 rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300">
          <span className="font-semibold">プレビュー表示中</span>
          <span className="opacity-70">— 非公開状態のページをコンソールから確認しています。一般ユーザーにはこのページは表示されません。</span>
        </div>
      )}
      <HostedChatClient
        botPublicId={bot.public_id}
        displayName={bot.display_name ?? bot.name}
        purposeLabel={PURPOSE_LABEL[bot.chat_purpose ?? "custom"] ?? "カスタム"}
        welcomeMessage={bot.welcome_message ?? "こんにちは。ご質問を入力してください。"}
        placeholderText={bot.placeholder_text ?? "質問を入力"}
        disclaimerText={bot.disclaimer_text ?? "回答は参考情報です。重要事項は担当者へ確認してください。"}
        showCitations={Boolean(bot.show_citations ?? true)}
        showRetentionNotice={!requiresInternal}
        retentionHours={24}
        historyTurnLimit={bot.history_turn_limit ?? 8}
        headerBgColor={bot.ui_header_bg_color ?? "#0f172a"}
        headerTextColor={bot.ui_header_text_color ?? "#f8fafc"}
        footerBgColor={bot.ui_footer_bg_color ?? "#f8fafc"}
        footerTextColor={bot.ui_footer_text_color ?? "#0f172a"}
        faqQuestions={(bot.faq_questions as string[] | null) ?? []}
        logoUrl={(bot.bot_logo_url as string | null) ?? null}
        widgetToken={widgetToken}
        embedded={embedded}
        authenticatedMode={requiresInternal}
      />
    </div>
  )
}
