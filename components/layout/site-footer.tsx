import Image from "next/image"
import Link from "next/link"

import { headerLinks } from "@/lib/marketing-content"
import { Container } from "@/components/layout/container"

function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-black/10 bg-white/70 py-10 dark:border-white/10 dark:bg-slate-950/40">
      <Container className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="space-y-3">
          <Image
            src="/images/knotic-square-logo.png"
            alt="knotic logo"
            width={36}
            height={36}
            className="size-9 rounded-md"
          />
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            URLやPDFを投入するだけで、専用AIチャットボットを構築・公開できるサービスです。
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Product</p>
          <div className="grid gap-2 text-sm text-muted-foreground">
            {headerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
            <Link href="/integrations" className="hover:text-foreground">
              連携
            </Link>
            <Link href="/security" className="hover:text-foreground">
              セキュリティ
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Company</p>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <Link href="/contact" className="hover:text-foreground">
              お問い合わせ
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              利用規約
            </Link>
            <Link href="/demo" className="hover:text-foreground">
              デモ
            </Link>
          </div>
        </div>
      </Container>

      <Container className="mt-8 border-t border-black/10 pt-6 text-xs text-muted-foreground dark:border-white/10">
        <p>© {new Date().getFullYear()} knotic / make-it-tech.com</p>
      </Container>
    </footer>
  )
}

export { SiteFooter }
