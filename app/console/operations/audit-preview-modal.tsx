"use client"

import Link from "next/link"

import { AuditLogList } from "@/app/console/audit/audit-log-list"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type AuditRow = Parameters<typeof AuditLogList>[0]["rows"][number]

export function AuditPreviewModal({
  rows,
  auditError,
}: {
  rows: AuditRow[]
  auditError: { message?: string } | null
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="rounded-full">
          直近1日のログを表示
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>監査ログ（直近24時間）</DialogTitle>
          <DialogDescription>
            詳細検索や長期間の確認は監査ログページで行えます。
          </DialogDescription>
        </DialogHeader>

        {auditError ? (
          <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            監査ログの読み込みに失敗しました。しばらく時間をおいて再試行してください。
          </p>
        ) : null}

        {!auditError && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">直近24時間の監査イベントはありません。</p>
        ) : null}

        {!auditError && rows.length > 0 ? (
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <AuditLogList rows={rows} />
          </div>
        ) : null}

        <DialogFooter>
          <Button asChild variant="outline">
            <Link href="/console/audit">すべての監査ログを確認</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
