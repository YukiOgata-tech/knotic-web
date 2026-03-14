"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { MutableRefObject } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import type { DotLottie } from "@lottiefiles/dotlottie-react"

const ROUTE_LOADER_DOTLOTTIE_ANIMATION_ID = "main"
const ROUTE_LOADER_BLOCK_ATTR = "data-knotic-route-loader-blocked"
const ROUTE_LOADER_START_EVENT = "knotic:route-loader:start"

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

function clearTimeoutRef(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }
}

function clearIntervalRef(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current !== null) {
    window.clearInterval(timerRef.current)
    timerRef.current = null
  }
}

function RouteTransitionLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeKey = useMemo(() => `${pathname}?${searchParams.toString()}`, [pathname, searchParams])

  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  const visibleRef = useRef(false)
  const activeRef = useRef(false)
  const showDelayRef = useRef<number | null>(null)
  const progressIntervalRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const failSafeTimerRef = useRef<number | null>(null)
  const dotLottieRef = useRef<DotLottie | null>(null)
  const knownPathRef = useRef(
    typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : ""
  )

  useEffect(() => {
    visibleRef.current = visible
  }, [visible])

  const finishNavigation = useCallback(() => {
    if (!activeRef.current) return
    activeRef.current = false

    clearTimeoutRef(showDelayRef)
    clearIntervalRef(progressIntervalRef)
    clearTimeoutRef(failSafeTimerRef)

    if (!visibleRef.current) {
      setProgress(0)
      return
    }

    setProgress(100)
    clearTimeoutRef(hideTimerRef)
    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 220)
  }, [])

  const startNavigation = useCallback(() => {
    if (activeRef.current) return
    activeRef.current = true

    clearTimeoutRef(hideTimerRef)
    clearTimeoutRef(showDelayRef)
    showDelayRef.current = window.setTimeout(() => {
      setVisible(true)
      setProgress(14)
      clearIntervalRef(progressIntervalRef)
      progressIntervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 88) return prev
          const step = Math.max(2, Math.round((92 - prev) / 7))
          return Math.min(88, prev + step)
        })
      }, 170)
    }, 120)

    clearTimeoutRef(failSafeTimerRef)
    failSafeTimerRef.current = window.setTimeout(() => {
      finishNavigation()
    }, 12000)
  }, [finishNavigation])

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (isModifiedClick(event)) return
      if (document.documentElement.getAttribute(ROUTE_LOADER_BLOCK_ATTR) === "true") return

      const target = event.target as Element | null
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.hasAttribute("download")) return
      if (anchor.target && anchor.target !== "_self") return
      if (anchor.dataset.noRouteLoader === "true") return

      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#")) return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return

      const currentPath = `${window.location.pathname}${window.location.search}`
      const nextPath = `${url.pathname}${url.search}`
      if (currentPath === nextPath) return
      if (url.pathname.startsWith("/api")) return

      startNavigation()
    }

    const onPopState = () => {
      const newPath = `${window.location.pathname}${window.location.search}`
      if (newPath === knownPathRef.current) return // hash-only change
      startNavigation()
    }

    const onManualStart = () => {
      if (document.documentElement.getAttribute(ROUTE_LOADER_BLOCK_ATTR) === "true") return
      startNavigation()
    }

    document.addEventListener("click", onDocumentClick, true)
    window.addEventListener("popstate", onPopState)
    window.addEventListener(ROUTE_LOADER_START_EVENT, onManualStart)

    return () => {
      document.removeEventListener("click", onDocumentClick, true)
      window.removeEventListener("popstate", onPopState)
      window.removeEventListener(ROUTE_LOADER_START_EVENT, onManualStart)
      clearTimeoutRef(showDelayRef)
      clearTimeoutRef(hideTimerRef)
      clearTimeoutRef(failSafeTimerRef)
      clearIntervalRef(progressIntervalRef)
      activeRef.current = false
    }
  }, [startNavigation])

  useEffect(() => {
    knownPathRef.current = `${window.location.pathname}${window.location.search}`
    finishNavigation()
    // routeKey changes when navigation is completed.
  }, [finishNavigation, routeKey])

  useEffect(() => {
    const instance = dotLottieRef.current
    if (!instance) return

    if (visible) {
      instance.play()
      return
    }

    instance.stop()
  }, [visible])

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-95 transition-opacity duration-150 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="absolute inset-0 bg-transparent backdrop-blur-[3.5px]" />
      <div className="absolute left-0 top-0 h-1 w-full bg-black/10 dark:bg-white/10">
        <div
          className="h-full bg-cyan-500 transition-[width] duration-200 ease-out dark:bg-cyan-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center" role="status" aria-live="polite" aria-label="画面を読み込み中">
        <DotLottieReact
          src="/lotties/knotic_split_assemble_embedded.lottie"
          animationId={ROUTE_LOADER_DOTLOTTIE_ANIMATION_ID}
          loop
          autoplay={false}
          dotLottieRefCallback={(instance) => {
            dotLottieRef.current = instance
          }}
          className="h-80 w-80 sm:h-120 sm:w-120"
        />
      </div>
    </div>
  )
}

export { RouteTransitionLoader }
