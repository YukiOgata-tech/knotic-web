"use client"

import { Loader2, Pause, Play, RotateCcw, Upload } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { DotLottie as DotLottiePlayer } from "@lottiefiles/dotlottie-web"
import type { DotLottie } from "@lottiefiles/dotlottie-web"
import Lottie from "lottie-react"
import type { LottieRefCurrentProps } from "lottie-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type LottieJson = Record<string, unknown>
type PreviewAsset = { kind: "json"; data: LottieJson } | { kind: "dotlottie"; src: string }

const DEFAULT_LOTTIE_PATH = "/lotties/knotic_split_assemble_embedded.lottie"

function isObject(value: unknown): value is LottieJson {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function pathKind(path: string): PreviewAsset["kind"] {
  const normalized = path.split("?")[0]?.split("#")[0]?.toLowerCase() ?? ""
  if (normalized.endsWith(".lottie")) return "dotlottie"
  return "json"
}

function fileKind(file: File): PreviewAsset["kind"] | null {
  const lower = file.name.toLowerCase()
  if (lower.endsWith(".lottie")) return "dotlottie"
  if (lower.endsWith(".json")) return "json"
  if (file.type === "application/json") return "json"
  return null
}

function LottiePreviewPanel() {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null)
  const dotLottieCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const dotLottieRef = useRef<DotLottie | null>(null)
  const dotLottieObjectUrlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [path, setPath] = useState(DEFAULT_LOTTIE_PATH)
  const [asset, setAsset] = useState<PreviewAsset | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [loop, setLoop] = useState(true)
  const [speed, setSpeed] = useState(1)

  const cleanupDotLottieObjectUrl = useCallback(() => {
    if (!dotLottieObjectUrlRef.current) return
    URL.revokeObjectURL(dotLottieObjectUrlRef.current)
    dotLottieObjectUrlRef.current = null
  }, [])

  const loadFromPath = useCallback(async (nextPath: string) => {
    const normalizedPath = nextPath.trim()
    if (!normalizedPath) {
      setError("読み込みパスを入力してください。")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(normalizedPath, { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`読み込みに失敗しました (HTTP ${response.status})`)
      }

      const kind = pathKind(normalizedPath)
      if (kind === "dotlottie") {
        cleanupDotLottieObjectUrl()
        setAsset({ kind: "dotlottie", src: normalizedPath })
        setIsPlaying(true)
        return
      }

      const json: unknown = await response.json()
      if (!isObject(json)) {
        throw new Error("Lottie JSON形式ではありません。")
      }

      cleanupDotLottieObjectUrl()
      setAsset({ kind: "json", data: json })
      setIsPlaying(true)
    } catch (err) {
      cleanupDotLottieObjectUrl()
      setAsset(null)
      setError(err instanceof Error ? err.message : "Lottie JSONの読み込みに失敗しました。")
    } finally {
      setLoading(false)
    }
  }, [cleanupDotLottieObjectUrl])

  useEffect(() => {
    void loadFromPath(DEFAULT_LOTTIE_PATH)
  }, [loadFromPath])

  useEffect(() => {
    if (asset?.kind !== "json") return
    lottieRef.current?.setSpeed(speed)
  }, [asset, speed])

  useEffect(() => {
    if (asset?.kind !== "dotlottie") return
    dotLottieRef.current?.setSpeed(speed)
  }, [asset, speed])

  useEffect(() => {
    if (asset?.kind !== "dotlottie") return
    dotLottieRef.current?.setLoop(loop)
  }, [asset, loop])

  useEffect(() => {
    if (asset?.kind !== "dotlottie") return
    if (isPlaying) {
      dotLottieRef.current?.play()
      return
    }
    dotLottieRef.current?.pause()
  }, [asset, isPlaying])

  useEffect(() => {
    if (asset?.kind !== "dotlottie") {
      dotLottieRef.current?.destroy()
      dotLottieRef.current = null
      return
    }
    const canvas = dotLottieCanvasRef.current
    if (!canvas) return

    dotLottieRef.current?.destroy()
    const instance = new DotLottiePlayer({
      canvas,
      src: asset.src,
      autoplay: isPlaying,
      loop,
      speed,
    })
    dotLottieRef.current = instance

    return () => {
      instance.destroy()
      if (dotLottieRef.current === instance) {
        dotLottieRef.current = null
      }
    }
  }, [asset, isPlaying, loop, speed])

  useEffect(() => {
    return () => {
      cleanupDotLottieObjectUrl()
    }
  }, [cleanupDotLottieObjectUrl])

  const handleLoadButton = () => {
    void loadFromPath(path.trim())
  }

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const kind = fileKind(file)
      if (!kind) {
        throw new Error("対応形式は .json または .lottie のみです。")
      }

      if (kind === "dotlottie") {
        cleanupDotLottieObjectUrl()
        const objectUrl = URL.createObjectURL(file)
        dotLottieObjectUrlRef.current = objectUrl
        setAsset({ kind: "dotlottie", src: objectUrl })
        setPath(file.name)
        setIsPlaying(true)
        return
      }

      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      if (!isObject(parsed)) {
        throw new Error("Lottie JSON形式ではありません。")
      }

      cleanupDotLottieObjectUrl()
      setAsset({ kind: "json", data: parsed })
      setPath(file.name)
      setIsPlaying(true)
    } catch (err) {
      cleanupDotLottieObjectUrl()
      setAsset(null)
      setError(err instanceof Error ? err.message : "ファイルの読み込みに失敗しました。")
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setLoading(false)
    }
  }

  const handlePlayPause = () => {
    if (!asset) return

    if (asset.kind === "dotlottie") {
      if (!dotLottieRef.current) return
      if (isPlaying) {
        dotLottieRef.current.pause()
        setIsPlaying(false)
        return
      }
      dotLottieRef.current.play()
      setIsPlaying(true)
      return
    }

    if (!lottieRef.current) return
    if (isPlaying) {
      lottieRef.current.pause()
      setIsPlaying(false)
      return
    }

    lottieRef.current.play()
    setIsPlaying(true)
  }

  const handleRestart = () => {
    if (!asset) return

    if (asset.kind === "dotlottie") {
      if (!dotLottieRef.current) return
      dotLottieRef.current.stop()
      dotLottieRef.current.play()
      setIsPlaying(true)
      return
    }

    if (!lottieRef.current) return
    lottieRef.current.stop()
    lottieRef.current.play()
    setIsPlaying(true)
  }

  return (
    <section className="-mx-4 border-y border-black/20 bg-white/90 px-4 py-5 sm:mx-0 sm:rounded-3xl sm:border sm:p-6 dark:border-white/10 dark:bg-slate-900/75">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
        Lottie Preview
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-3xl">Lottie再生確認</h2>
      <p className="mt-2 text-[13px] leading-6 text-zinc-600 dark:text-zinc-300 sm:text-base sm:leading-8">
        .json / .lottie を読み込んで、再生・ループ・速度をブラウザ上で確認できます。
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <Input
          value={path}
          onChange={(event) => setPath(event.target.value)}
          placeholder="/lotties/your-animation.json"
          disabled={loading}
        />
        <Button type="button" onClick={handleLoadButton} disabled={loading} className="rounded-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : "パスから読み込む"}
        </Button>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.lottie,application/json,application/octet-stream"
            className="hidden"
            onChange={(event) => void handleFileSelect(event)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="rounded-full"
          >
            <Upload className="size-4" />
            ファイルを選択
          </Button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-black/20 bg-zinc-50 p-3 sm:p-5 dark:border-white/10 dark:bg-slate-950/70">
        <div className="relative flex min-h-[290px] items-center justify-center rounded-xl border border-black/10 bg-[radial-gradient(circle_at_22%_20%,rgba(6,182,212,.12),transparent_30%),radial-gradient(circle_at_78%_80%,rgba(56,189,248,.14),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f4f8ff_100%)] p-3 dark:border-white/10 dark:bg-[radial-gradient(circle_at_22%_20%,rgba(34,211,238,.18),transparent_28%),radial-gradient(circle_at_78%_80%,rgba(56,189,248,.16),transparent_34%),linear-gradient(180deg,#0c1526_0%,#0b1220_100%)]">
          {asset ? (
            asset.kind === "json" ? (
              <Lottie
                lottieRef={lottieRef}
                animationData={asset.data}
                loop={loop}
                autoplay
                className="h-[260px] w-full max-w-[320px] sm:h-[320px] sm:max-w-[420px]"
              />
            ) : (
              <canvas
                key={asset.src}
                ref={dotLottieCanvasRef}
                className="h-[260px] w-full max-w-[320px] sm:h-[320px] sm:max-w-[420px]"
              />
            )
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-300">プレビュー可能なLottieがありません。</p>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[auto_auto_minmax(0,1fr)] sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={handlePlayPause}
              disabled={!asset || loading}
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
              {isPlaying ? "一時停止" : "再生"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={handleRestart}
              disabled={!asset || loading}
            >
              <RotateCcw className="size-4" />
              最初から
            </Button>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={loop}
              onChange={(event) => setLoop(event.target.checked)}
              className="size-4 accent-cyan-600"
              disabled={!asset || loading}
            />
            ループ再生
          </label>

          <label className="grid gap-1 text-sm text-zinc-700 dark:text-zinc-200">
            <span>再生速度: {speed.toFixed(1)}x</span>
            <input
              type="range"
              min={0.2}
              max={2}
              step={0.1}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              disabled={!asset || loading}
              className="w-full accent-cyan-600"
            />
          </label>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-rose-600 dark:text-rose-300" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          推奨: <code>public/lotties</code> に配置した <code>.json</code> または <code>.lottie</code> を{" "}
          <code>/lotties/xxx.ext</code> で指定すると確認しやすいです。
        </p>
      )}
    </section>
  )
}

export { LottiePreviewPanel }
