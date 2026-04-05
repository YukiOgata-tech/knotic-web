"use client"

import * as React from "react"

type Props = {
  botId: string
  isPublic: boolean
  isEditor: boolean
  isFreeTier?: boolean
  redirectTo?: string
  action: (formData: FormData) => void | Promise<void>
}

export function PublicToggle({ botId, isPublic, isEditor, isFreeTier = false, redirectTo = "/console/bots", action }: Props) {
  const formRef = React.useRef<HTMLFormElement>(null)
  const [checked, setChecked] = React.useState(isFreeTier ? false : isPublic)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingNext, setPendingNext] = React.useState<boolean | null>(null)

  const isDisabled = !isEditor || isFreeTier

  return (
    <>
      <form ref={formRef} action={action} className="inline-flex items-center gap-2">
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input type="hidden" name="bot_id" value={botId} />
        <input type="hidden" name="next_public" value={String(checked)} />
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            disabled={isDisabled}
            onChange={(e) => {
              const next = e.target.checked
              setPendingNext(next)
              setConfirmOpen(true)
            }}
          />
          <span className="h-6 w-11 rounded-full bg-zinc-300 transition peer-checked:bg-emerald-500 peer-disabled:opacity-50" />
          <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </label>
        <span className="text-xs text-muted-foreground">{checked ? "有効" : "無効"}</span>
        {isFreeTier && (
          <span className="text-xs text-amber-600 dark:text-amber-400">（公開には契約が必要）</span>
        )}
      </form>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-lg border border-black/20 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <p className="text-sm font-semibold">Bot状態を変更しますか？</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {pendingNext ? "このBotを有効状態にします。" : "このBotを無効状態にします。"}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-black/15 px-3 py-1.5 text-xs dark:border-white/20"
                onClick={() => {
                  setConfirmOpen(false)
                  setPendingNext(null)
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-slate-900"
                onClick={() => {
                  if (pendingNext === null) {
                    setConfirmOpen(false)
                    return
                  }
                  setChecked(pendingNext)
                  const form = formRef.current
                  if (form) {
                    const hidden = form.querySelector<HTMLInputElement>('input[name=\"next_public\"]')
                    if (hidden) hidden.value = String(pendingNext)
                    form.requestSubmit()
                  }
                  setConfirmOpen(false)
                  setPendingNext(null)
                }}
              >
                変更する
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
