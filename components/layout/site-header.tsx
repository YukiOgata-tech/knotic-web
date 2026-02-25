import Image from "next/image"
import Link from "next/link"
import { Menu } from "lucide-react"

import { HeaderAuthActions } from "@/components/auth/auth-aware"
import { headerLinks } from "@/lib/marketing-content"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/75">
      <Container className="flex h-16 max-w-none items-center justify-between gap-3 px-4 sm:px-8 xl:px-12">
        <Link href="/" className="flex shrink-0 items-center">
          <span className="relative block aspect-[220/56] h-8 w-auto max-w-[46vw] sm:h-12 md:h-14">
            <Image
              src="/images/knotic-title.png"
              alt="knotic"
              fill
              className="object-contain dark:hidden"
              priority
            />
            <Image
              src="/images/knotic-title-whitetext.png"
              alt="knotic"
              fill
              className="hidden object-contain dark:block"
              priority
            />
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-700 md:flex dark:text-zinc-200">
          {headerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-zinc-950 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-full md:hidden"
                aria-label="メニューを開く"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0">
              <div className="flex h-full flex-col px-6 py-8">
                <div className="space-y-1">
                  {headerLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-3 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-muted hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-auto grid gap-3">
                  <HeaderAuthActions mobile />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <HeaderAuthActions />
        </div>
      </Container>
    </header>
  )
}

export { SiteHeader }
