"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

import type { FaqItem } from "@/content/faqs"

type FaqAccordionProps = {
  items: FaqItem[]
  defaultOpenIndex?: number
}

function FaqAccordion({ items, defaultOpenIndex = 0 }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    items.length > defaultOpenIndex ? defaultOpenIndex : null
  )

  return (
    <div className="grid gap-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index

        return (
          <article
            key={item.q}
            className="overflow-hidden rounded-2xl border border-black/10 bg-white/90 shadow-[0_10px_30px_-26px_rgba(15,23,42,.55)] dark:border-white/10 dark:bg-slate-900/75"
          >
            <button
              type="button"
              onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${index}`}
            >
              <span className="text-sm font-semibold leading-7 text-zinc-900 dark:text-zinc-100 sm:text-base">
                {item.q}
              </span>
              <ChevronDown
                className={`size-5 shrink-0 text-zinc-500 transition-transform duration-200 dark:text-zinc-300 ${
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
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <div className="border-t border-black/5 px-5 pb-5 pt-4 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:text-zinc-300 sm:px-6">
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
