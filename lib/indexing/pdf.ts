import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs"
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs"

type PdfTextItem = {
  str?: string
  width?: number
  height?: number
  transform?: number[]
  fontName?: string
}

type TextSpan = {
  text: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontName: string
}

type TextLine = {
  spans: TextSpan[]
  text: string
  y: number
  fontSize: number
}

type CellLine = TextLine & {
  cells: string[]
}

export async function pdfToStructuredMarkdown(buffer: Buffer, filename: string): Promise<string> {
  configurePdfWorker()

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise

  const sections: string[] = [
    `# ${filename}`,
    "",
    `PDF pages: ${doc.numPages}`,
    "",
  ]
  let totalTextLength = 0

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const spans = toTextSpans(textContent.items as PdfTextItem[])
    const lines = buildLines(spans)

    if (lines.length === 0) continue

    sections.push(`## Page ${pageNumber}`)
    sections.push("")
    sections.push(renderLines(lines))
    sections.push("")
    totalTextLength += lines.reduce((sum, line) => sum + line.text.length, 0)
  }

  if (totalTextLength < 50) {
    throw new Error(
      "PDFから十分なテキストを抽出できませんでした。スキャン画像PDFの場合はOCR済みPDFまたはテキスト形式で追加してください。"
    )
  }

  return sections.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

function configurePdfWorker() {
  const globalWithPdfWorker = globalThis as typeof globalThis & {
    pdfjsWorker?: typeof pdfjsWorker
  }
  globalWithPdfWorker.pdfjsWorker ??= pdfjsWorker
}

function toTextSpans(items: PdfTextItem[]): TextSpan[] {
  return items
    .map((item) => {
      const text = String(item.str ?? "").replace(/\s+/g, " ").trim()
      const transform = item.transform ?? []
      const x = Number(transform[4] ?? 0)
      const y = Number(transform[5] ?? 0)
      const width = Number(item.width ?? 0)
      const height = Number(item.height ?? 0)
      const fontSize = Math.max(height, Math.abs(Number(transform[3] ?? 0)), Math.abs(Number(transform[0] ?? 0)), 1)
      return {
        text,
        x,
        y,
        width,
        height,
        fontSize,
        fontName: String(item.fontName ?? ""),
      }
    })
    .filter((item) => item.text.length > 0)
}

function buildLines(spans: TextSpan[]): TextLine[] {
  const sorted = [...spans].sort((a, b) => {
    const yDiff = b.y - a.y
    if (Math.abs(yDiff) > 2) return yDiff
    return a.x - b.x
  })
  const lines: TextSpan[][] = []

  for (const span of sorted) {
    const tolerance = Math.max(2.5, span.fontSize * 0.45)
    const target = lines.find((line) => Math.abs(average(line.map((item) => item.y)) - span.y) <= tolerance)
    if (target) {
      target.push(span)
    } else {
      lines.push([span])
    }
  }

  return lines
    .map((line) => {
      const ordered = [...line].sort((a, b) => a.x - b.x)
      return {
        spans: ordered,
        text: renderLineText(ordered),
        y: average(ordered.map((item) => item.y)),
        fontSize: average(ordered.map((item) => item.fontSize)),
      }
    })
    .filter((line) => line.text.length > 0)
}

function renderLineText(spans: TextSpan[]) {
  let output = ""
  let previousRight: number | null = null

  for (const span of spans) {
    if (previousRight !== null) {
      const gap = span.x - previousRight
      const charWidth = estimateCharWidth(span)
      if (gap > Math.max(2.5, charWidth * 0.7)) {
        output += " "
      }
    }
    output += span.text
    previousRight = span.x + span.width
  }

  return output.replace(/\s+/g, " ").trim()
}

function renderLines(lines: TextLine[]) {
  const rendered: string[] = []
  let paragraph: string[] = []
  let index = 0

  function flushParagraph() {
    if (paragraph.length === 0) return
    rendered.push(paragraph.join(" ").replace(/\s+/g, " ").trim())
    rendered.push("")
    paragraph = []
  }

  while (index < lines.length) {
    const tableBlock = collectTableBlock(lines, index)
    if (tableBlock.length >= 2) {
      flushParagraph()
      rendered.push(renderTable(tableBlock))
      rendered.push("")
      index += tableBlock.length
      continue
    }

    const line = lines[index]
    const listLine = normalizeListLine(line.text)
    if (listLine) {
      flushParagraph()
      rendered.push(listLine)
      index += 1
      continue
    }

    if (isHeadingLine(line, lines[index + 1] ?? null)) {
      flushParagraph()
      rendered.push(`### ${line.text}`)
      rendered.push("")
      index += 1
      continue
    }

    paragraph.push(line.text)
    index += 1
  }

  flushParagraph()
  return rendered.join("\n").trim()
}

function collectTableBlock(lines: TextLine[], start: number): CellLine[] {
  const block: CellLine[] = []
  for (let i = start; i < lines.length; i += 1) {
    const cells = splitLineIntoCells(lines[i])
    if (cells.length < 2) break
    block.push({ ...lines[i], cells })
  }

  if (block.length < 2) return []
  const maxColumns = Math.max(...block.map((line) => line.cells.length))
  if (maxColumns < 2) return []
  return block
}

function splitLineIntoCells(line: TextLine) {
  const cells: string[] = []
  let current: string[] = []
  let previousRight: number | null = null

  for (const span of line.spans) {
    if (previousRight !== null) {
      const gap = span.x - previousRight
      if (gap > Math.max(18, line.fontSize * 2.2)) {
        cells.push(current.join("").trim())
        current = []
      }
    }
    current.push(span.text)
    previousRight = span.x + span.width
  }

  cells.push(current.join("").trim())
  return cells.filter(Boolean)
}

function renderTable(lines: CellLine[]) {
  const columnCount = Math.max(...lines.map((line) => line.cells.length))
  const rows = lines.map((line) => normalizeCells(line.cells, columnCount))
  const firstRow = rows[0]
  const firstRowLooksLikeHeader = firstRow.every((cell) => cell.length <= 24)
  const headers = firstRowLooksLikeHeader
    ? firstRow
    : Array.from({ length: columnCount }, (_, index) => `Column ${index + 1}`)
  const bodyRows = firstRowLooksLikeHeader ? rows.slice(1) : rows

  return [
    `| ${headers.map(escapeTableCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...bodyRows.map((row) => `| ${row.map(escapeTableCell).join(" | ")} |`),
  ].join("\n")
}

function normalizeCells(cells: string[], columnCount: number) {
  return Array.from({ length: columnCount }, (_, index) => cells[index] ?? "")
}

function normalizeListLine(text: string) {
  const bullet = text.match(/^([•◦▪●○・\-*+])\s+(.+)$/)
  if (bullet) return `- ${bullet[2]}`

  const numbered = text.match(/^(\d+|[０-９]+)[.)．。]\s+(.+)$/)
  if (!numbered) return null
  const number = numbered[1].replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
  return `${number}. ${numbered[2]}`
}

function isHeadingLine(line: TextLine, nextLine: TextLine | null) {
  const text = line.text.trim()
  if (text.length < 3 || text.length > 80) return false
  if (/[。！？.!?]$/.test(text)) return false
  if (/^(第?\d+章|第?\d+節|実験\s*\d+|[0-9]+(?:\.[0-9]+)+\s+|[IVX]+[-章])/.test(text)) return true
  if (line.fontSize >= 14 && (!nextLine || line.fontSize > nextLine.fontSize * 1.08)) return true
  if (text.length <= 28 && /[:：]$/.test(text)) return true
  return false
}

function escapeTableCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>").trim()
}

function estimateCharWidth(span: TextSpan) {
  return span.text.length > 0 ? span.width / span.text.length : span.fontSize * 0.5
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}
