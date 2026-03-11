import Image from "next/image"
import Link from "next/link"

import { headerLinks } from "@/lib/marketing-content"
import { Container } from "@/components/layout/container"

function SiteFooter() {
  return (
    <footer className="relative mt-0 overflow-hidden border-t border-black/20 bg-white/70 py-4 sm:py-10 dark:border-white/10 dark:bg-slate-950/40">
      <div className="pointer-events-none absolute inset-0 opacity-60 dark:hidden">
        <Image src="/images/bg-001-l.png" alt="" fill className="object-cover" />
      </div>
      <div className="pointer-events-none absolute inset-0 hidden opacity-20 dark:block">
        <Image src="/images/bg-001-d.png" alt="" fill className="object-cover" />
      </div>
      <Container className="relative z-10 grid max-w-none gap-8 px-4 sm:px-8 md:grid-cols-[1.2fr_1fr_1fr] xl:px-12">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center">
            <span className="relative block aspect-220/56 h-10 w-auto max-w-[52vw] sm:h-14">
              <Image
                src="/images/knotic-title.png"
                alt="knotic"
                fill
                className="object-contain dark:hidden"
              />
              <Image
                src="/images/knotic-title-whitetext.png"
                alt="knotic"
                fill
                className="hidden object-contain dark:block"
              />
            </span>
          </Link>
          <p className="max-w-md text-sm leading-7 text-slate-900 dark:text-slate-50 font-semibold">
            URLやドキュメントファイルを投入するだけで、専用のAIチャットボットを構築･公開できるサービスです。
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm sm:text-md font-semibold">- Product</p>
          <div className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {headerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-zinc-950 dark:hover:text-white hover:underline"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/integrations" className="transition-colors hover:text-zinc-950 dark:hover:text-white hover:underline">
              連携
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">- Company</p>
          <div className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            <Link href="/contact" className="transition-colors hover:text-zinc-950 dark:hover:text-white hover:underline">
              お問い合わせ
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-zinc-950 dark:hover:text-white hover:underline">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="transition-colors hover:text-zinc-950 dark:hover:text-white hover:underline">
              利用規約
            </Link>
            <Link href="/specified-commercial-transactions" className="transition-colors hover:text-zinc-950 dark:hover:text-white hover:underline">
              特定商取引法に基づく表記
            </Link>
            <Link href="/security" className="transition-colors hover:text-zinc-950 dark:hover:text-white hover:underline">
              セキュリティ
            </Link>
          </div>
        </div>
      </Container>

      <Container className="relative z-10 mt-8 max-w-none border-t border-black/20 px-4 pt-6 text-xs text-muted-foreground dark:border-white/10 sm:px-8 xl:px-12">
        <p>© {new Date().getFullYear()} knotic / make-it-tech.com</p>
      </Container>
    </footer>
  )
}

export { SiteFooter }



