"use client"

import * as React from "react"
import { Building2, Check, ChevronDown, Plus } from "lucide-react"

import { switchTenantAction, joinTenantByTokenAction } from "@/app/console/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type Membership = {
  tenant_id: string
  role: "editor" | "reader"
  tenants: { id: string; slug: string; display_name: string } | null
}

type Props = {
  currentTenantId: string
  memberships: Membership[]
}

export function TenantSwitcherButton({ currentTenantId, memberships }: Props) {
  const [open, setOpen] = React.useState(false)
  const [joinOpen, setJoinOpen] = React.useState(false)
  const [tokenValue, setTokenValue] = React.useState("")
  const [tokenError, setTokenError] = React.useState("")
  const [joining, setJoining] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  React.useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open])

  function openJoin() {
    setOpen(false)
    setTokenValue("")
    setTokenError("")
    setJoining(false)
    setJoinOpen(true)
  }

  async function handleJoinSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tokenValue.trim()) {
      setTokenError("招待URLまたはトークンを入力してください。")
      return
    }
    setTokenError("")
    setJoining(true)
    const fd = new FormData()
    fd.set("token", tokenValue.trim())
    try {
      await joinTenantByTokenAction(fd)
    } catch {
      setTokenError("参加に失敗しました。もう一度お試しください。")
      setJoining(false)
    }
  }

  // ── Single-tenant: show only "参加" button ─────────────────
  if (memberships.length <= 1) {
    return (
      <>
        <button
          type="button"
          onClick={openJoin}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/70"
        >
          <Plus className="size-4 shrink-0" />
          別のテナントに参加
        </button>
        <JoinDialog
          open={joinOpen}
          onOpenChange={setJoinOpen}
          tokenValue={tokenValue}
          tokenError={tokenError}
          joining={joining}
          onChange={(v) => { setTokenValue(v); setTokenError("") }}
          onSubmit={handleJoinSubmit}
        />
      </>
    )
  }

  // ── Multi-tenant: dropdown switcher ────────────────────────
  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
        >
          <Building2 className="size-4 shrink-0 text-slate-400" />
          <span className="flex-1 truncate text-left">テナント切替</span>
          <ChevronDown className={cn("size-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[200px] rounded-xl border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-slate-900">
            <div className="p-1">
              {memberships.map((m) => {
                const isCurrent = m.tenant_id === currentTenantId
                const name = m.tenants?.display_name ?? m.tenant_id
                return (
                  <form key={m.tenant_id} action={switchTenantAction}>
                    <input type="hidden" name="tenant_id" value={m.tenant_id} />
                    <button
                      type={isCurrent ? "button" : "submit"}
                      disabled={isCurrent}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        isCurrent
                          ? "cursor-default bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-white"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      )}
                    >
                      <span className="flex-1 truncate">{name}</span>
                      {isCurrent && <Check className="size-3.5 shrink-0 text-emerald-500" />}
                      <span className="shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {m.role === "editor" ? "Editor" : "Reader"}
                      </span>
                    </button>
                  </form>
                )
              })}
            </div>
            <div className="border-t border-black/10 p-1 dark:border-white/10">
              <button
                type="button"
                onClick={openJoin}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Plus className="size-4 shrink-0" />
                別のテナントに参加
              </button>
            </div>
          </div>
        )}
      </div>

      <JoinDialog
        open={joinOpen}
        onOpenChange={setJoinOpen}
        tokenValue={tokenValue}
        tokenError={tokenError}
        joining={joining}
        onChange={(v) => { setTokenValue(v); setTokenError("") }}
        onSubmit={handleJoinSubmit}
      />
    </>
  )
}

// ── Join-by-token dialog (uses Radix portal → renders under body) ──
type JoinDialogProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
  tokenValue: string
  tokenError: string
  joining: boolean
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

function JoinDialog({ open, onOpenChange, tokenValue, tokenError, joining, onChange, onSubmit }: JoinDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>別のテナントに参加</DialogTitle>
          <DialogDescription>
            招待URLまたはトークンを入力してください
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300">
            <p className="font-medium">参加方法</p>
            <p className="mt-1">
              招待メールに記載された招待URL（https://...）、またはトークン（<code>inv_</code> から始まる文字列）を貼り付けてください。
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              招待URL / トークン
            </label>
            <textarea
              value={tokenValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder="招待URLまたはトークンを貼り付け"
              rows={3}
              className={cn(
                "w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors",
                "bg-white placeholder-slate-400 dark:bg-slate-800 dark:placeholder-slate-500",
                tokenError
                  ? "border-destructive focus:border-destructive"
                  : "border-black/15 focus:border-blue-500 dark:border-white/15"
              )}
              disabled={joining}
            />
            {tokenError && (
              <p className="mt-1 text-xs text-destructive">{tokenError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={joining}
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="rounded-full"
              disabled={joining || !tokenValue.trim()}
            >
              {joining ? "参加中..." : "参加する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
