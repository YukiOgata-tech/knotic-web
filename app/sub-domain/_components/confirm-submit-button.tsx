"use client"

import React, { useRef, useState } from "react"

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

type Props = Omit<React.ComponentProps<typeof Button>, "type" | "onClick"> & {
  description: string
  confirmLabel?: string
  destructive?: boolean
}

export function ConfirmSubmitButton({
  description,
  confirmLabel = "実行する",
  destructive = false,
  children,
  ...buttonProps
}: Props) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)

  return (
    <>
      <Button
        {...buttonProps}
        type="button"
        onClick={(e) => {
          const form = (e.currentTarget as HTMLElement).closest("form") as HTMLFormElement | null
          formRef.current = form
          setOpen(true)
        }}
      >
        {children}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>操作の確認</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className={
                destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
              onClick={() => {
                setOpen(false)
                formRef.current?.requestSubmit()
              }}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
