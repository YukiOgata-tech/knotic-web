"use client"

import React, { useState } from "react"

import { updatePlanLimitsAction } from "@/app/sub-domain/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PlatformPlanFull } from "@/app/sub-domain/_lib/data"

type Props = { plan: PlatformPlanFull }

export function PlanLimitsForm({ plan }: Props) {
  const [pending, setPending] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirmed) {
      e.preventDefault()
      setConfirmed(true)
      return
    }
    setPending(true)
  }

  return (
    <form action={updatePlanLimitsAction} onSubmit={handleSubmit} className="grid gap-4">
      <input type="hidden" name="plan_id" value={plan.id} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Bot上限数 (max_bots)</Label>
          <Input
            name="max_bots"
            type="number"
            min={0}
            defaultValue={plan.max_bots}
            required
            disabled={pending}
          />
        </div>

        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">月間メッセージ上限 (max_monthly_messages)</Label>
          <Input
            name="max_monthly_messages"
            type="number"
            min={0}
            defaultValue={plan.max_monthly_messages}
            required
            disabled={pending}
          />
        </div>

        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">ストレージ上限MB (max_storage_mb)</Label>
          <Input
            name="max_storage_mb"
            type="number"
            min={0}
            defaultValue={plan.max_storage_mb}
            required
            disabled={pending}
          />
        </div>

        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">ホスティングページ上限 (max_hosted_pages)</Label>
          <Input
            name="max_hosted_pages"
            type="number"
            min={0}
            defaultValue={plan.max_hosted_pages}
            required
            disabled={pending}
          />
        </div>

        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">
            Botキャップ (internal_max_bots_cap)
            <span className="ml-1 text-[10px] text-muted-foreground">0=無効</span>
          </Label>
          <Input
            name="internal_max_bots_cap"
            type="number"
            min={0}
            defaultValue={plan.internal_max_bots_cap}
            required
            disabled={pending}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="has_api"
            defaultChecked={plan.has_api}
            disabled={pending}
            className="size-4 rounded border-black/20 accent-amber-500 dark:border-white/20"
          />
          API利用可 (has_api)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="has_hosted_page"
            defaultChecked={plan.has_hosted_page}
            disabled={pending}
            className="size-4 rounded border-black/20 accent-amber-500 dark:border-white/20"
          />
          ホスティング利用可 (has_hosted_page)
        </label>
      </div>

      {confirmed ? (
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={pending}
            className="bg-amber-600 text-white hover:bg-amber-500"
          >
            {pending ? "更新中..." : "本当に更新する"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmed(false)}
            disabled={pending}
          >
            キャンセル
          </Button>
          <span className="text-xs text-amber-600 dark:text-amber-400">
            この変更は即時反映され、全テナントのリミット判定に影響します。
          </span>
        </div>
      ) : (
        <div>
          <Button type="submit" variant="outline" size="sm">
            保存する
          </Button>
        </div>
      )}
    </form>
  )
}
