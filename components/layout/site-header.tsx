"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"

import { HeaderAuthActions } from "@/components/auth/auth-aware"
import { headerLinks } from "@/lib/marketing-content"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"

function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const mobileMenuPanelRef = useRef<HTMLElement | null>(null)
  const mobileMenuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return

      if (mobileMenuPanelRef.current?.contains(target)) return
      if (mobileMenuTriggerRef.current?.contains(target)) return

      setMobileMenuOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false)
      }
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("pointerdown", onPointerDown, true)
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("pointerdown", onPointerDown, true)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-black/50 bg-white/80 backdrop-blur-md dark:border-white/50 dark:bg-slate-950/75">
      <Container className="flex h-16 max-w-none items-center justify-between gap-3 px-4 sm:px-8 xl:px-12">
        <Link href="/" className="flex shrink-0 items-center">
          <span className="relative block aspect-220/56 h-8 w-auto max-w-[46vw] sm:h-12 md:h-14">
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

        <nav className="hidden items-center gap-6 text-lg font-medium text-zinc-700 md:flex dark:text-zinc-200">
          {headerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:underline hover:text-zinc-950 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="md:hidden">
            <Button
              ref={mobileMenuTriggerRef}
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              aria-label={mobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-panel-menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>

            {mounted
              ? createPortal(
                  <AnimatePresence>
                    {mobileMenuOpen ? (
                      <>
                        <motion.button
                          type="button"
                          aria-label="メニューを閉じる"
                          onPointerDown={() => setMobileMenuOpen(false)}
                          className="fixed inset-0 z-70 bg-slate-900/30 backdrop-blur-[5px] dark:bg-black/55"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                        />

                        <motion.aside
                          ref={mobileMenuPanelRef}
                          id="mobile-panel-menu"
                          role="dialog"
                          aria-modal="true"
                          className="fixed top-0 right-0 z-80 h-[min(66vh,500px)] w-[min(80vw,420px)] overflow-hidden rounded-bl-3xl bg-white dark:bg-slate-950"
                          initial={{
                            opacity: 0,
                            x: 28,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          exit={{
                            opacity: 0,
                            x: 20,
                          }}
                          transition={{
                            duration: 0.28,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
                          >
                            <Image
                              src="/images/knotic-square-logo.png"
                              alt=""
                              width={220}
                              height={220}
                              className="h-auto w-[44vw] max-w-55 opacity-[0.18] dark:opacity-[0.24]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="absolute top-4 right-4 z-20 inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-zinc-700 transition-colors hover:bg-zinc-100 dark:bg-slate-950/90 dark:text-zinc-200 dark:hover:bg-slate-900"
                            aria-label="メニューを閉じる"
                          >
                            <X className="size-4" />
                          </button>

                          <div className="relative z-10 flex h-full w-full flex-col overflow-y-auto bg-transparent pb-3 pl-6 pr-5 pt-14 sm:pr-6">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-800 dark:text-cyan-200">
                              Navigation
                            </p>
                            <nav className="space-y-1">
                              {headerLinks.map((item) => (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-slate-900 dark:hover:text-white"
                                >
                                  {item.label}
                                </Link>
                              ))}
                            </nav>
                            <div className="mt-auto pt-4 grid gap-3">
                              <HeaderAuthActions mobile />
                            </div>
                          </div>
                        </motion.aside>
                      </>
                    ) : null}
                  </AnimatePresence>,
                  document.body
                )
              : null}
          </div>

          <div className="hidden md:block">
            <HeaderAuthActions />
          </div>
        </div>
      </Container>
    </header>
  )
}

export { SiteHeader }
