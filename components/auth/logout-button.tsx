"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { createClient } from "@/lib/supabase/client"
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

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  async function onLogout() {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setOpen(false)
      router.push("/")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full hover:text-red-700" disabled={loading}>
          {loading ? "ログアウト中..." : "ログアウト"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ログアウトしますか？</DialogTitle>
          <DialogDescription>
            現在のセッションを終了してトップページへ移動します。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            キャンセル
          </Button>
          <Button type="button" onClick={onLogout} disabled={loading}>
            {loading ? "ログアウト中..." : "ログアウトする"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}