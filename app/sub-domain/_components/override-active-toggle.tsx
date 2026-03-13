"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

type Props = {
  defaultChecked: boolean
}

export function OverrideActiveToggle({ defaultChecked }: Props) {
  const [checked, setChecked] = useState(defaultChecked)

  return (
    <div className="flex flex-col gap-1.5">
      {/* hidden input でフォーム値を送信 */}
      <input type="hidden" name="is_active" value={checked ? "on" : "off"} />

      <div className="flex items-center gap-3">
        <Switch
          id="override-active"
          checked={checked}
          onCheckedChange={setChecked}
          className="data-[state=checked]:bg-emerald-500"
        />
        <Label htmlFor="override-active" className="cursor-pointer select-none">
          {checked ? (
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              有効（Stripeを無視してこのOverrideを適用）
            </span>
          ) : (
            <span className="font-medium text-muted-foreground">
              無効（DBに保存のみ・Stripe優先）
            </span>
          )}
        </Label>
      </div>
      <p className="text-[11px] text-muted-foreground">
        無効にしてもOverride設定はDBに残ります。再度有効化すれば即時適用されます。
      </p>
    </div>
  )
}
