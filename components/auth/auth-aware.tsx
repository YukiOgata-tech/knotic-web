"use client"

import Link from "next/link"
import * as React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

function useAuthState() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then((result: { data: { user: unknown | null } }) => {
      setIsLoggedIn(Boolean(result.data.user))
      setReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: unknown } | null) => {
      setIsLoggedIn(Boolean(session?.user))
      setReady(true)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { isLoggedIn, ready }
}

type AuthAwareCtaButtonProps = {
  guestHref: string
  guestLabel: string
  authHref?: string
  authLabel?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  className?: string
}

function AuthAwareCtaButton({
  guestHref,
  guestLabel,
  authHref = "/console",
  authLabel = "管理画面へ",
  variant,
  size,
  className,
}: AuthAwareCtaButtonProps) {
  const { isLoggedIn, ready } = useAuthState()

  const href = ready && isLoggedIn ? authHref : guestHref
  const label = ready && isLoggedIn ? authLabel : guestLabel

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link href={href}>{label}</Link>
    </Button>
  )
}

function HeaderAuthActions({ mobile = false }: { mobile?: boolean }) {
  const { isLoggedIn, ready } = useAuthState()

  if (ready && isLoggedIn) {
    return (
        <Button asChild className={mobile ? "rounded-full" : "rounded-full"}>
        <Link href="/console">管理画面へ</Link>
      </Button>
    )
  }

  if (mobile) {
    return (
      <>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/login">ログイン</Link>
        </Button>
        <Button asChild className="rounded-full">
          <Link href="/signup">無料で試す</Link>
        </Button>
      </>
    )
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="hidden rounded-full sm:inline-flex">
        <Link href="/login">ログイン</Link>
      </Button>
      <Button asChild size="sm" className="rounded-full">
        <Link href="/signup">無料で試す</Link>
      </Button>
    </>
  )
}

export { AuthAwareCtaButton, HeaderAuthActions }
