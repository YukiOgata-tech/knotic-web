import * as XLSX from "xlsx"

/**
 * CSVまたはExcel（.xlsx/.xls）バッファをMarkdown形式に変換する。
 * ヘッダー行を見出しとして使用し、各行をテーブル行として出力する。
 */
export function spreadsheetToMarkdown(buffer: Buffer, filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""

  let workbook: XLSX.WorkBook
  if (ext === "csv") {
    const text = buffer.toString("utf-8")
    workbook = XLSX.read(text, { type: "string" })
  } else {
    workbook = XLSX.read(buffer, { type: "buffer" })
  }

  const sections: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })

    if (rows.length === 0) continue

    const headers = rows[0].map(String)
    const dataRows = rows.slice(1).filter((row) => row.some((cell) => String(cell).trim() !== ""))

    if (dataRows.length === 0) continue

    const isQaSheet = isFaqSheet(headers)

    if (workbook.SheetNames.length > 1) {
      sections.push(`## ${sheetName}`)
    }

    if (isQaSheet) {
      // Q&A形式: question/answer列を検出して読みやすいMarkdownに変換
      const questionIdx = findColumnIndex(headers, ["question", "質問", "q", "問い", "問題"])
      const answerIdx = findColumnIndex(headers, ["answer", "回答", "a", "答え", "解答"])

      for (const row of dataRows) {
        const question = String(row[questionIdx] ?? "").trim()
        const answer = String(row[answerIdx] ?? "").trim()
        if (!question) continue
        sections.push(`### ${question}`)
        if (answer) sections.push(answer)
        sections.push("")
      }
    } else {
      // 汎用テーブル形式: Markdownテーブルとして出力
      const headerLine = `| ${headers.join(" | ")} |`
      const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`
      sections.push(headerLine, separatorLine)

      for (const row of dataRows) {
        const cells = headers.map((_, i) => String(row[i] ?? "").replace(/\|/g, "\\|").trim())
        sections.push(`| ${cells.join(" | ")} |`)
      }
      sections.push("")
    }
  }

  if (sections.length === 0) {
    throw new Error("スプレッドシートにデータが見つかりませんでした。")
  }

  return sections.join("\n")
}

function isFaqSheet(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase())
  const hasQuestion = lower.some((h) => ["question", "質問", "q", "問い", "問題"].includes(h))
  const hasAnswer = lower.some((h) => ["answer", "回答", "a", "答え", "解答"].includes(h))
  return hasQuestion && hasAnswer
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.toLowerCase())
  for (const candidate of candidates) {
    const idx = lower.indexOf(candidate)
    if (idx !== -1) return idx
  }
  return 0
}
