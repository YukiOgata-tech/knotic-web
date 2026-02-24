import * as React from "react"
import Link from "next/link"

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
    <div className="relative overflow-x-clip bg-[linear-gradient(180deg,#fff9ee_0%,#ffffff_40%,#f7fbff_100%)] dark:bg-[linear-gradient(180deg,#0f172a_0%,#0b1220_45%,#0a0f1a_100%)]">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-80 bg-[radial-gradient(circle_at_20%_40%,rgba(255,166,0,.16),transparent_55%),radial-gradient(circle_at_78%_12%,rgba(6,182,212,.16),transparent_52%)] dark:bg-[radial-gradient(circle_at_20%_40%,rgba(250,204,21,.12),transparent_55%),radial-gradient(circle_at_78%_12%,rgba(34,211,238,.16),transparent_52%)]" />
      <Container className="relative py-10 sm:py-14">
        <section className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl leading-8 text-zinc-600 dark:text-zinc-300">{description}</p>
        </section>
        <div className="mt-8">{children}</div>
      </Container>
    </div>
  )
}

function CTASection() {
  return (
    <section className="rounded-3xl bg-zinc-900 px-6 py-9 text-white dark:bg-cyan-950/40 dark:ring-1 dark:ring-cyan-400/30 sm:px-8">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        まずは1つ目のAIボットを公開してみましょう
      </h2>
      <p className="mt-3 max-w-2xl text-zinc-300">
        URL/PDFの投入から公開までを短いサイクルで検証し、必要な機能を段階的に広げる進め方を推奨します。
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="rounded-full bg-cyan-500 text-white hover:bg-cyan-600">
          <Link href="/signup">無料で試す</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-full border-white/35 bg-transparent text-white hover:bg-white/15 hover:text-white"
        >
          <Link href="/contact">お問い合わせ</Link>
        </Button>
      </div>
    </section>
  )
}

export { CTASection, PageFrame }
