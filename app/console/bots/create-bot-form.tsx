"use client"

import { Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"

import { createBotAction } from "@/app/console/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

function SubmitBtn({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-fit rounded-full" disabled={disabled || pending}>
      {pending ? (
        <>
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          作成中…
        </>
      ) : (
        "Botを作成"
      )}
    </Button>
  )
}

export function CreateBotForm({ isEditor }: { isEditor: boolean }) {
  return (
    <form action={createBotAction} className="grid gap-3 rounded-xl border border-black/20 p-4 dark:border-white/10">
      <input type="hidden" name="redirect_to" value="/console/bots" />
      <h3 className="font-medium">新規Bot作成</h3>
      <Input name="name" placeholder="Bot名（例:会社FAQボット）" required disabled={!isEditor} />
      <Textarea name="description" placeholder="Botの説明（任意）" disabled={!isEditor} />
      <SubmitBtn disabled={!isEditor} />
    </form>
  )
}
