"use client"

import { useRef, useState } from "react"
import { Loader2 } from "lucide-react"

import { setTenantActiveAction } from "@/app/sub-domain/actions"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

type Props = {
  tenantId: string
  active: boolean
  redirectTo: string
}

export function TenantActiveToggle({ tenantId, active, redirectTo }: Props) {
  const [checked, setChecked] = useState(active)
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const changed = checked !== active

  function handleCheckedChange(value: boolean) {
    setChecked(value)
    setConfirming(false)
  }

  async function handleSubmit() {
    setPending(true)
    formRef.current?.requestSubmit()
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-4">
        <Switch
          id="tenant-active"
          checked={checked}
          onCheckedChange={handleCheckedChange}
          disabled={pending}
          className="data-[state=checked]:bg-emerald-500"
        />
        <Label htmlFor="tenant-active" className="cursor-pointer select-none">
          {checked ? (
            <span className="font-medium text-emerald-700 dark:text-emerald-400">有効（稼働中）</span>
          ) : (
            <span className="font-medium text-muted-foreground">無効（解約済み）</span>
          )}
        </Label>
      </div>

      {changed && !confirming && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirming(true)}
            className={checked ? "" : "border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"}
          >
            {checked ? "有効化する" : "無効化する"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setChecked(active); setConfirming(false) }}
          >
            元に戻す
          </Button>
        </div>
      )}

      {confirming && (
        <div className="grid gap-2 rounded-xl border border-amber-300/50 bg-amber-50/60 p-3 dark:border-amber-700/40 dark:bg-amber-950/20">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {checked
              ? "テナントを有効化します。よろしいですか？"
              : "テナントを無効化します。解約済み扱いになります。Stripe側の操作は別途必要です。よろしいですか？"}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={handleSubmit}
              className={checked ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-red-600 hover:bg-red-500 text-white"}
            >
              {pending ? <><Loader2 className="size-3.5 animate-spin" /> 更新中...</> : "確定する"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {/* hidden form */}
      <form ref={formRef} action={setTenantActiveAction} className="hidden">
        <input type="hidden" name="tenant_id" value={tenantId} />
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input type="hidden" name="active" value={checked ? "on" : "off"} />
        <button type="submit" />
      </form>
    </div>
  )
}
