"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  async function onLogout() {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" className="rounded-full" onClick={onLogout} disabled={loading}>
      {loading ? "ログアウト中..." : "ログアウト"}
    </Button>
  )
}
