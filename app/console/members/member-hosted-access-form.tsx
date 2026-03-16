"use client"

import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"

import { updateMemberHostedAccessAction } from "@/app/console/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type BotAccessRow = {
  id: string
  name: string
  access_mode: "public" | "internal" | null
  require_auth_for_hosted: boolean | null
}

type Props = {
  memberUserId: string
  memberLabel: string
  memberRole: "editor" | "reader"
  memberIsActive: boolean
  hostedBots: BotAccessRow[]
  initialAllowedBotIds: string[]
  redirectTo: string
  isEditor: boolean
  hostedAccessControlReady: boolean
}

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="sm" variant="outline" disabled={disabled || pending}>
      {pending ? (
        <>
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          保存中
        </>
      ) : (
        "この設定を保存"
      )}
    </Button>
  )
}

export function MemberHostedAccessForm({
  memberUserId,
  memberLabel,
  memberRole,
  memberIsActive,
  hostedBots,
  initialAllowedBotIds,
  redirectTo,
  isEditor,
  hostedAccessControlReady,
}: Props) {
  const [allowedBotIds, setAllowedBotIds] = useState<Set<string>>(
    () => new Set(initialAllowedBotIds)
  )

  const formDisabled = !isEditor || !memberIsActive || !hostedAccessControlReady
  const allowedCount = useMemo(() => allowedBotIds.size, [allowedBotIds])

  function handleToggle(botId: string, checked: boolean) {
    setAllowedBotIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(botId)
      } else {
        next.delete(botId)
      }
      return next
    })
  }

  return (
    <form
      action={updateMemberHostedAccessAction}
      className="grid gap-3 rounded-lg border border-black/15 p-3 dark:border-white/10"
    >
      <input type="hidden" name="redirect_to" value={redirectTo} />
      <input type="hidden" name="member_user_id" value={memberUserId} />
      {Array.from(allowedBotIds).map((botId) => (
        <input key={`${memberUserId}-${botId}`} type="hidden" name="allowed_bot_ids" value={botId} />
      ))}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <p className="font-medium">{memberLabel}</p>
          <p className="text-xs text-muted-foreground">
            {memberRole === "editor" ? "Editor" : "Reader"} ・ {memberIsActive ? "有効" : "無効"} ・ 許可 {allowedCount}/
            {hostedBots.length}
          </p>
        </div>
        <SaveButton disabled={formDisabled} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {hostedBots.map((bot) => {
          const requiresAuth = bot.access_mode === "internal" || Boolean(bot.require_auth_for_hosted)
          const isAllowed = allowedBotIds.has(bot.id)
          const switchId = `member-${memberUserId}-bot-${bot.id}`
          return (
            <div
              key={switchId}
              className="flex items-start justify-between gap-2 rounded-md border border-black/10 p-2 text-xs dark:border-white/10"
            >
              <div className="grid gap-0.5">
                <Label htmlFor={switchId} className="cursor-pointer text-xs font-medium">
                  {bot.name}
                </Label>
                <p className="text-muted-foreground">
                  {requiresAuth ? "認証必須モードで制御対象" : "公開モード（制御の影響なし）"}
                </p>
              </div>
              <div className="grid justify-items-end gap-1.5">
                <Switch
                  id={switchId}
                  checked={isAllowed}
                  onCheckedChange={(checked) => handleToggle(bot.id, checked)}
                  disabled={formDisabled}
                  size="default"
                  className={cn(
                    "mt-0.5 touch-manipulation scale-125",
                    isAllowed && "data-[state=checked]:bg-emerald-500"
                  )}
                />
                <span className={cn("text-[11px] font-medium", isAllowed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                  {isAllowed ? "許可" : "除外"}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </form>
  )
}
