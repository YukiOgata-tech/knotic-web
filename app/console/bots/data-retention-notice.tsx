"use client"

import * as React from "react"
import { Info } from "lucide-react"

export function DataRetentionNotice() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-amber-700 underline underline-offset-2 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
      >
        <Info className="size-3" />
        データ保持について
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-lg border border-black/20 bg-white p-5 shadow-lg dark:border-white/10 dark:bg-slate-900">
            <p className="font-semibold">無料プランのデータ保持ポリシー</p>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <p>
                無料プランではBotデータを無期限に保持しません。
                最終操作（Bot作成・ソース追加・設定変更など）からの経過日数で管理されます。
              </p>
              <div className="grid gap-1.5 rounded-md border border-black/10 bg-slate-50 px-3 py-2.5 text-xs dark:border-white/10 dark:bg-slate-800/50">
                <p>
                  <span className="font-medium text-foreground">最終操作から7日経過</span>
                  {" "}→ コンソールに削除予告の警告を表示
                </p>
                <p>
                  <span className="font-medium text-foreground">最終操作から14日経過</span>
                  {" "}→ BotおよびすべてのナレッジデータをServer側で自動削除
                </p>
              </div>
              <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                いずれかのプランに契約すると、削除対象から除外されます。
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-black/15 px-3 py-1.5 text-xs hover:bg-slate-50 dark:border-white/20 dark:hover:bg-slate-800"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
