"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"

type RenderedSlide = {
  title: string
  imageData: string
}

function buildFitScript() {
  return `
(() => {
  function fitSlide(slide) {
    const frame = slide.querySelector('.frame') || slide;
    frame.style.transform = 'none';
    frame.style.transformOrigin = 'top left';

    const frameRect = frame.getBoundingClientRect();
    let maxRight = frameRect.right;
    let maxBottom = frameRect.bottom;

    const nodes = frame.querySelectorAll('*');
    for (const node of nodes) {
      if (!(node instanceof HTMLElement)) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.right > maxRight) maxRight = rect.right;
      if (rect.bottom > maxBottom) maxBottom = rect.bottom;
    }

    const neededWidth = frameRect.width + Math.max(0, maxRight - frameRect.right);
    const neededHeight = frameRect.height + Math.max(0, maxBottom - frameRect.bottom);
    const ratio = Math.max(neededWidth / frameRect.width, neededHeight / frameRect.height, 1);
    const scale = 1 / ratio;
    frame.style.transform = 'scale(' + scale + ')';
  }

  function fitAll() {
    const slides = document.querySelectorAll('.slide');
    slides.forEach((slide) => fitSlide(slide));
  }

  window.addEventListener('load', () => {
    fitAll();
    setTimeout(fitAll, 60);
    setTimeout(fitAll, 180);
  });
  window.addEventListener('resize', fitAll);
})();
`
}

function extractStyleAndSlides(sourceHtml: string) {
  const styleMatch = sourceHtml.match(/<style>([\s\S]*?)<\/style>/i)
  const styleBlock = styleMatch?.[1] ?? ""
  const slideMatches = sourceHtml.match(/<section class="slide[\s\S]*?<\/section>/g) ?? []
  const slides = slideMatches.map((html, index) => {
    const titleMatch = html.match(/data-title="([^"]+)"/i)
    return {
      title: titleMatch?.[1] ?? `Slide ${index + 1}`,
      html,
    }
  })
  return { styleBlock, slides }
}

function normalizeSlideMarkup(slideHtml: string) {
  return slideHtml.replace(/<section\s+class="([^"]*)"/i, (_full, classValue: string) => {
    const classSet = new Set(
      classValue
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
    classSet.add("slide")
    classSet.add("active")
    classSet.delete("prev")
    return `<section class="${Array.from(classSet).join(" ")}"`
  })
}

function buildPrintableHtml(sourceHtml: string) {
  const { styleBlock, slides } = extractStyleAndSlides(sourceHtml)
  const fitScript = buildFitScript()
  const pages = slides
    .map((slide) => `<div class="sheet-wrap">${normalizeSlideMarkup(slide.html)}</div>`)
    .join("\n")

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>audition_presentation_export</title>
  <style>${styleBlock}</style>
  <style>
    @page {
      size: 1280px 720px;
      margin: 0;
    }
    html, body { height: auto !important; }
    body {
      margin: 0;
      padding: 0;
      overflow: auto !important;
      background: #071a14;
    }
    html, body, * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .export-root { margin: 0; padding: 0; }
    .sheet-wrap {
      width: 1280px;
      height: 720px;
      position: relative;
      overflow: hidden;
      isolation: isolate;
      break-after: page;
      page-break-after: always;
      background:
        radial-gradient(circle at 15% 20%, rgba(124,201,169,.18), transparent 25%),
        radial-gradient(circle at 85% 10%, rgba(30,127,90,.22), transparent 22%),
        linear-gradient(135deg, #071a14 0%, #0b251d 45%, #123325 100%);
    }
    .sheet-wrap:last-child {
      break-after: auto;
      page-break-after: auto;
    }
    .sheet-wrap .slide {
      position: relative !important;
      left: 0 !important;
      top: 0 !important;
      inset: auto !important;
      margin: 0 !important;
      display: block !important;
      width: 1280px !important;
      height: 720px !important;
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
      pointer-events: auto !important;
    }
    .sheet-wrap .slide *,
    .sheet-wrap .slide::before,
    .sheet-wrap .slide::after {
      animation: none !important;
    }
    .controls, .helper, #fx, .viewport { display: none !important; }
  </style>
</head>
<body>
  <main class="export-root">${pages}</main>
  <script>${fitScript}</script>
</body>
</html>`
}

async function loadPrintableFrame(frame: HTMLIFrameElement, sourceHtml: string) {
  const printableHtml = buildPrintableHtml(sourceHtml)
  frame.srcdoc = printableHtml

  await new Promise<void>((resolve) => {
    const onLoad = () => {
      frame.removeEventListener("load", onLoad)
      resolve()
    }
    frame.addEventListener("load", onLoad)
  })

  const targetWindow = frame.contentWindow
  const targetDocument = frame.contentDocument
  if (!targetWindow || !targetDocument) {
    throw new Error("プレビュー生成の初期化に失敗しました。")
  }

  await targetDocument.fonts?.ready?.catch(() => undefined)
  await new Promise((resolve) => targetWindow.setTimeout(resolve, 420))
  return { targetWindow, targetDocument }
}

export function AuditionPresentationClient({ sourceHtml }: { sourceHtml: string }) {
  const { slides } = React.useMemo(() => extractStyleAndSlides(sourceHtml), [sourceHtml])
  const printFrameRef = React.useRef<HTMLIFrameElement | null>(null)
  const [renderedSlides, setRenderedSlides] = React.useState<RenderedSlide[]>([])
  const [isRendering, setIsRendering] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)

  const prepareRenderedSlides = React.useCallback(async () => {
    const frame = printFrameRef.current
    if (!frame) throw new Error("エクスポート用フレームが初期化されていません。")

    setIsRendering(true)
    try {
      const { targetDocument } = await loadPrintableFrame(frame, sourceHtml)
      const { toPng } = await import("html-to-image")
      const nodes = Array.from(targetDocument.querySelectorAll(".sheet-wrap")) as HTMLElement[]
      if (nodes.length === 0) throw new Error("スライド要素の取得に失敗しました。")

      const result: RenderedSlide[] = []
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i]
        const imageData = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          width: 1280,
          height: 720,
          canvasWidth: 2560,
          canvasHeight: 1440,
          backgroundColor: "#071a14",
        })
        result.push({ title: slides[i]?.title ?? `Slide ${i + 1}`, imageData })
      }

      setRenderedSlides(result)
      return result
    } finally {
      setIsRendering(false)
    }
  }, [slides, sourceHtml])

  React.useEffect(() => {
    void prepareRenderedSlides()
  }, [prepareRenderedSlides])

  const handleExportPdf = React.useCallback(async () => {
    setIsExporting(true)
    try {
      const slidesForExport =
        renderedSlides.length > 0 ? renderedSlides : await prepareRenderedSlides()
      if (slidesForExport.length === 0) return

      const { jsPDF } = await import("jspdf")
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1280, 720],
        compress: true,
      })

      for (let i = 0; i < slidesForExport.length; i += 1) {
        if (i > 0) pdf.addPage([1280, 720], "landscape")
        pdf.setFillColor(7, 26, 20)
        pdf.rect(0, 0, 1280, 720, "F")
        pdf.addImage(slidesForExport[i].imageData, "PNG", 0, 0, 1280, 720, undefined, "FAST")
      }
      pdf.save("audition-presentation.pdf")
    } catch (error) {
      console.error(error)
      alert("PDFエクスポートに失敗しました。しばらくして再試行してください。")
    } finally {
      setIsExporting(false)
    }
  }, [prepareRenderedSlides, renderedSlides])

  return (
    <div className="mx-auto grid w-full max-w-375 gap-4 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/20 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-900/80">
        <div>
          <h1 className="text-base font-semibold sm:text-lg">Audition Presentation</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            すべてのスライドを一覧表示しています。PDFはこの一覧と同じ描画データから生成します。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={isRendering}
            onClick={() => void prepareRenderedSlides()}
          >
            {isRendering ? "再レンダリング中..." : "再レンダリング"}
          </Button>
          <Button
            type="button"
            onClick={handleExportPdf}
            className="rounded-full"
            disabled={isRendering || isExporting || slides.length === 0}
          >
            {isExporting ? "PDF生成中..." : "PDFエクスポート"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {renderedSlides.length > 0 ? (
          renderedSlides.map((slide, index) => (
            <div
              key={`${index}-${slide.title}`}
              className="rounded-xl border border-black/20 bg-black p-3 dark:border-white/10"
            >
              <div className="mx-auto aspect-video w-full max-w-300 overflow-hidden rounded-lg border border-white/10 bg-black">
                <img src={slide.imageData} alt={slide.title} className="h-full w-full object-contain" />
              </div>
              <div className="mt-2 text-center text-xs text-white/70">
                {index + 1} / {renderedSlides.length} - {slide.title}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-black/20 bg-black p-3 dark:border-white/10">
            <div className="grid h-40 place-items-center text-sm text-white/70">
              {isRendering ? "スライドをレンダリング中..." : "スライドを読み込めませんでした。"}
            </div>
          </div>
        )}
      </div>
      {renderedSlides.length > 0 ? (
        <div className="rounded-xl border border-emerald-300/50 bg-emerald-50/80 p-3 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          {renderedSlides.length}ページを読み込みました。この内容でPDFを生成します。
        </div>
      ) : null}

      <iframe
        ref={printFrameRef}
        title="audition-render-frame"
        className="pointer-events-none fixed top-0 -left-[99999px] h-180 w-7xl opacity-0"
      />

      {slides.length === 0 ? (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50/80 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200">
          スライドの解析に失敗しました。`docs/audition_presentation_preview.html` の構造を確認してください。
        </div>
      ) : null}
    </div>
  )
}
