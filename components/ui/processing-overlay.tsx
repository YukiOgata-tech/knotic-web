"use client"

type ProcessingOverlayProps = {
  open: boolean
  title: string
  description?: string
}

export function ProcessingOverlay({ open, title, description }: ProcessingOverlayProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-cyan-200/65 bg-[linear-gradient(165deg,#f2fdff_0%,#ffffff_55%,#f8fbff_100%)] p-5 shadow-2xl dark:border-cyan-700/50 dark:bg-[linear-gradient(165deg,#06172a_0%,#0b1220_55%,#091626_100%)] sm:p-6">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-200/45 blur-2xl dark:bg-cyan-500/20" />
        <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-amber-200/45 blur-2xl dark:bg-amber-400/20" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/25" />
            <div className="knotic-loader-orbit absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 border-r-cyan-400/80" />
            <div className="knotic-loader-core absolute inset-[12px] rounded-full bg-cyan-500/90 dark:bg-cyan-300/85" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
            {description ? (
              <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">{description}</p>
            ) : null}
          </div>
        </div>

        <div className="relative z-10 mt-4 flex items-center gap-1.5 pl-0.5">
          <span className="knotic-loader-dot h-1.5 w-1.5 rounded-full bg-cyan-600 dark:bg-cyan-300" />
          <span className="knotic-loader-dot h-1.5 w-1.5 rounded-full bg-cyan-600 dark:bg-cyan-300 [animation-delay:120ms]" />
          <span className="knotic-loader-dot h-1.5 w-1.5 rounded-full bg-cyan-600 dark:bg-cyan-300 [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  )
}
