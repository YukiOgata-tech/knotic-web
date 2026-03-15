"use client"

import Link from "next/link"
import { useRef, useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type PlanCode = "lite" | "standard" | "pro"

const PLAN_RANK: Record<PlanCode, number> = {
  lite: 1,
  standard: 2,
  pro: 3,
}

type Props = {
  planCode: PlanCode
  planLabel: string
  currentPlanCode: PlanCode | null
  currentPlanLabel: string
  currentPeriodEndLabel: string
  disabled: boolean
  isCurrent: boolean
  planChangeLocked: boolean
  isScheduledTarget: boolean
}

function transitionType(current: PlanCode | null, target: PlanCode) {
  if (!current) return "new"
  if (PLAN_RANK[target] > PLAN_RANK[current]) return "upgrade"
  if (PLAN_RANK[target] < PLAN_RANK[current]) return "downgrade"
  return "same"
}

export function PlanChangeConfirmButton({
  planCode,
  planLabel,
  currentPlanCode,
  currentPlanLabel,
  currentPeriodEndLabel,
  disabled,
  isCurrent,
  planChangeLocked,
  isScheduledTarget,
}: Props) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)
  const changeType = transitionType(currentPlanCode, planCode)

  if (isCurrent) {
    return (
      <Button
        type="button"
        disabled
        className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900"
      >
        現在のプラン
      </Button>
    )
  }

  if (planChangeLocked) {
    return (
      <Button
        type="button"
        disabled
        className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900"
      >
        {isScheduledTarget ? "変更予約済み" : "変更予約中"}
      </Button>
    )
  }

  return (
    <>
      <form ref={formRef} action="/api/stripe/checkout" method="post">
        <input type="hidden" name="plan_code" value={planCode} />
        <Button
          type="button"
          disabled={disabled}
          className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900"
          onClick={() => setOpen(true)}
        >
          このプランに変更
        </Button>
      </form>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>プラン変更の確認</AlertDialogTitle>
            <AlertDialogDescription>
              契約内容と請求金額に関わる操作です。内容を確認のうえ実行してください。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-2 rounded-md border border-black/15 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-white/15 dark:bg-slate-900/50 dark:text-slate-200">
            <p>
              変更内容: {currentPlanLabel} → {planLabel}
            </p>
            {changeType === "upgrade" ? (
              <>
                <p>アップグレードは即時反映され、差額は日割りで請求されます。</p>
                <p>請求サイクル日は変更されません（次回更新日は維持されます）。</p>
              </>
            ) : null}
            {changeType === "downgrade" ? (
              <>
                <p>ダウングレードは次回更新日（{currentPeriodEndLabel}）から反映されます。</p>
                <p>現在の請求期間中の返金はありません。</p>
              </>
            ) : null}
            {changeType === "new" ? (
              <p>新規契約としてCheckoutに遷移し、決済完了後に契約が有効化されます。</p>
            ) : null}
          </div>

          <div className="grid gap-2 rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/25 dark:text-amber-200">
            <p className="font-medium">実行前に以下の説明を確認してください。</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/help/billing-plan-change"
                target="_blank"
                className="rounded-full border border-amber-400/70 px-2.5 py-1 text-[11px] hover:bg-amber-100 dark:border-amber-400/40 dark:hover:bg-amber-900/35"
              >
                料金切替の説明ページ
              </Link>
              <Link
                href="/specified-commercial-transactions"
                target="_blank"
                className="rounded-full border border-amber-400/70 px-2.5 py-1 text-[11px] hover:bg-amber-100 dark:border-amber-400/40 dark:hover:bg-amber-900/35"
              >
                特定商取引法に基づく表記
              </Link>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setOpen(false)
                formRef.current?.requestSubmit()
              }}
            >
              同意して変更する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
