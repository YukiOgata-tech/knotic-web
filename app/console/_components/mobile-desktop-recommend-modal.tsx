"use client"

import * as React from "react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const STORAGE_KEY = "knotic_console_pc_recommend_dismissed"

export function MobileDesktopRecommendModal() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)")

    const syncOpenState = () => {
      const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1"
      setOpen(media.matches && !dismissed)
    }

    syncOpenState()
    media.addEventListener("change", syncOpenState)
    return () => media.removeEventListener("change", syncOpenState)
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      window.localStorage.setItem(STORAGE_KEY, "1")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>PCでの利用を推奨しています</DialogTitle>
          <DialogDescription>
            管理画面はPCでの操作を前提に設計しています。モバイルでも利用できますが、詳細設定はPC利用を推奨します。
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

