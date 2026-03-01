import { notFound } from "next/navigation"

import {
  addPdfSourceAction,
  addUrlSourceAction,
  queueIndexAction,
  rotateWidgetTokenAction,
  toggleBotPublicAction,
  updateAllowedOriginsAction,
  updateHostedConfigAction,
} from "@/app/console/actions"
import { HostedConfigEditor } from "@/app/console/bots/hosted-config-editor"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { fetchConsoleData, requireConsoleContext } from "@/app/console/_lib/data"
import { firstParam } from "@/app/console/_lib/ui"

type PageProps = {
  params: Promise<{ bot_ref: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function extractPublicId(botRef: string) {
  const value = decodeURIComponent(botRef)
  const parts = value.split("--")
  const last = parts[parts.length - 1] ?? ""
  return last.startsWith("bot_") ? last : null
}

export default async function ConsoleBotDetailPage({ params, searchParams }: PageProps) {
  const { bot_ref: botRef } = await params
  const publicId = extractPublicId(botRef)
  if (!publicId) notFound()

  const query = (await searchParams) ?? {}
  const notice = firstParam(query.notice)
  const error = firstParam(query.error)
  const issuedApiKey = firstParam(query.issued_api_key)
  const widgetToken = firstParam(query.widget_token)

  const { membership } = await requireConsoleContext()
  if (!membership) return null

  const data = await fetchConsoleData(membership.tenant_id)
  const bot = data.bots.find((item) => item.public_id === publicId)
  if (!bot) notFound()

  const isEditor = membership.role === "editor"
  const maxHistoryTurnLimit = data.currentPlan?.code === "lite" ? 20 : 30
  const botSources = data.sources.filter((source) => source.bot_id === bot.id)
  const widgetTokenRow = data.tokenByBotId.get(bot.id) ?? null

  return (
    <div className="grid gap-4">
      <ConsoleAlerts notice={notice} error={error} issuedApiKey={issuedApiKey} widgetToken={widgetToken} />

      <HostedConfigEditor
        bot={bot}
        botSources={botSources}
        widgetTokenRow={widgetTokenRow}
        isEditor={isEditor}
        hasHostedPage={Boolean(data.currentPlan?.has_hosted_page)}
        maxHistoryTurnLimit={maxHistoryTurnLimit}
        backHref="/console/bots"
        redirectTo={`/console/bots/${encodeURIComponent(botRef)}`}
        saveAction={updateHostedConfigAction}
        togglePublicAction={toggleBotPublicAction}
        rotateWidgetTokenAction={rotateWidgetTokenAction}
        updateAllowedOriginsAction={updateAllowedOriginsAction}
        addUrlSourceAction={addUrlSourceAction}
        addPdfSourceAction={addPdfSourceAction}
        queueIndexAction={queueIndexAction}
      />
    </div>
  )
}
