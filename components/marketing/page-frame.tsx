import * as React from "react"
import Link from "next/link"

import { AuthAwareCtaButton } from "@/components/auth/auth-aware"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"

function PageFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="font-jp relative overflow-x-clip bg-[linear-gradient(180deg,#fff8ee_0%,#ffffff_46%,#f5faff_100%)] dark:bg-[linear-gradient(180deg,#091122_0%,#0a1324_40%,#090f1b_100%)]">
      <section className="relative isolate border-b border-black/20 dark:border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_30%,rgba(251,191,36,.24),transparent_36%),radial-gradient(circle_at_88%_22%,rgba(6,182,212,.22),transparent_36%),linear-gradient(130deg,rgba(255,255,255,.76),rgba(255,255,255,.35))] dark:bg-[radial-gradient(circle_at_6%_30%,rgba(250,204,21,.18),transparent_36%),radial-gradient(circle_at_88%_22%,rgba(34,211,238,.2),transparent_38%),linear-gradient(130deg,rgba(8,20,38,.9),rgba(8,20,38,.55))]" />
        <div className="pointer-events-none absolute inset-0 opacity-50 bg-[linear-gradient(to_right,rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,.08)_1px,transparent_1px)] bg-size-[42px_42px] dark:opacity-25" />
        <Container size="wide" className="relative py-6 sm:py-16 lg:py-20">
          <div className="max-w-4xl">
            <p className="inline-flex rounded-full border border-cyan-500/30 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-800 backdrop-blur dark:border-cyan-300/35 dark:bg-slate-900/55 dark:text-cyan-100">
              {eyebrow}
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl dark:text-zinc-50">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-700 sm:text-lg dark:text-zinc-200">
              {description}
            </p>
          </div>
        </Container>
      </section>
      <Container size="wide" className="relative py-8 sm:py-10">
        <div>{children}</div>
      </Container>
    </div>
  )
}

function CTASection() {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-zinc-900 bg-[url('/images/cta-bg-w.jpg')] bg-cover bg-center px-6 py-4 text-white sm:px-8 sm:py-9 dark:bg-[url('/images/cta-bg-d.png')] dark:ring-1 dark:ring-cyan-400/30">
      <div className="pointer-events-none absolute inset-0 bg-slate-600/45 dark:bg-gray-600/45" />
      <div className="relative z-10 ">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl dark:text-black">
          実際にAIボットを公開してみよう!
        </h2>
        <p className="mt-1 hidden max-w-2xl text-zinc-300 sm:mt-3 sm:block dark:text-black">
          URL/PDFの投入から公開までを短いサイクルで検証し、必要な機能を段階的に広げる進め方を推奨します。
        </p>
        <div className="mt-6 flex flex-row gap-3">
          <AuthAwareCtaButton
            guestHref="/signup"
            guestLabel="無料で試す"
            authHref="/console"
            authLabel="管理画面へ"
            className="rounded-full bg-cyan-500 text-white hover:bg-cyan-600"
          />
          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/35 bg-transparent text-white hover:bg-white/15 hover:text-white dark:border-black/40 dark:text-black"
          >
            <Link href="/contact">お問い合わせ</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export { CTASection, PageFrame }
