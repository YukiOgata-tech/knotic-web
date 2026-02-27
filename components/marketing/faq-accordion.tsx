"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

import type { FaqItem } from "@/content/faqs"

type FaqAccordionProps = {
  items: FaqItem[]
  defaultOpenIndex?: number
  compactMobile?: boolean
}

function FaqAccordion({ items, defaultOpenIndex = 0, compactMobile = false }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    items.length > defaultOpenIndex ? defaultOpenIndex : null
  )

  return (
    <div className={compactMobile ? "grid gap-0 sm:gap-4" : "grid gap-4"}>
      {items.map((item, index) => {
        const isOpen = openIndex === index

        return (
          <article
            key={item.q}
            className={
              compactMobile
                ? "group overflow-hidden border-b border-zinc-200/90 bg-transparent transition-all duration-200 dark:border-white/10 sm:rounded-2xl sm:border sm:border-black/10 sm:bg-white/90 sm:shadow-[0_14px_35px_-28px_rgba(15,23,42,.5)] sm:hover:border-cyan-300/60 sm:hover:shadow-[0_20px_40px_-30px_rgba(8,145,178,.45)] sm:dark:border-white/10 sm:dark:bg-slate-900/75 sm:dark:hover:border-cyan-500/40"
                : "group overflow-hidden rounded-2xl border border-black/10 bg-white/90 shadow-[0_14px_35px_-28px_rgba(15,23,42,.5)] transition-all duration-200 hover:border-cyan-300/60 hover:shadow-[0_20px_40px_-30px_rgba(8,145,178,.45)] dark:border-white/10 dark:bg-slate-900/75 dark:hover:border-cyan-500/40"
            }
          >
            <button
              type="button"
              onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
              className={
                compactMobile
                  ? "flex w-full items-center justify-between gap-4 px-1 py-4 text-left sm:px-6 sm:py-5"
                  : "flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
              }
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${index}`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/45 dark:text-cyan-300">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-base font-semibold leading-8 text-zinc-900 dark:text-zinc-100 sm:text-lg">
                  {item.q}
                </span>
              </div>
              <ChevronDown
                className={`mt-1 size-5 shrink-0 text-zinc-500 transition-transform duration-200 dark:text-zinc-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={`faq-panel-${index}`}
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  <div
                    className={
                      compactMobile
                        ? "border-t border-zinc-200/90 px-1 pb-5 pt-4 text-base leading-8 text-zinc-700 dark:border-white/10 dark:text-zinc-300 sm:border-black/5 sm:px-6 sm:pb-6"
                        : "border-t border-black/5 px-5 pb-5 pt-4 text-base leading-8 text-zinc-700 dark:border-white/10 dark:text-zinc-300 sm:px-6 sm:pb-6"
                    }
                  >
                    {item.a}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </article>
        )
      })}
    </div>
  )
}

export { FaqAccordion }
