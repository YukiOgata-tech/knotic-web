"use client"

import * as React from "react"
import { Sheet, TableIcon, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { faqCategories } from "@/content/faqs"
import { cn } from "@/lib/utils"

const KEYWORDS_MAP: Record<string, string[]> = {
  "サービスについて": ["サービス概要", "knotic", "導入"],
  "機能・設定": ["機能", "Bot設定", "Widget", "公開"],
  "料金・契約": ["料金", "プラン", "請求", "解約"],
  "セキュリティ・安全性": ["セキュリティ", "データ管理", "監査"],
}

type Row = {
  faq_id: string
  category: string
  question: string
  answer: string
  keywords: string
  updated_at: string
  is_active: string
}

const rows: Row[] = faqCategories.flatMap((cat, ci) =>
  cat.items.map((item, ii) => ({
    faq_id: `F${String(ci + 1).padStart(2, "0")}-${String(ii + 1).padStart(2, "0")}`,
    category: cat.label,
    question: item.q,
    answer: item.a,
    keywords: (KEYWORDS_MAP[cat.label] ?? []).join(","),
    updated_at: "2026-03-01",
    is_active: "TRUE",
  }))
)

const COLS: { key: keyof Row; label: string; width: string; mono?: boolean }[] = [
  { key: "faq_id",     label: "faq_id",     width: "w-[88px]",  mono: true },
  { key: "category",   label: "category",   width: "w-[120px]" },
  { key: "question",   label: "question",   width: "w-[220px]" },
  { key: "answer",     label: "answer",     width: "w-[340px]" },
  { key: "keywords",   label: "keywords",   width: "w-[160px]", mono: true },
  { key: "updated_at", label: "updated_at", width: "w-[100px]", mono: true },
  { key: "is_active",  label: "is_active",  width: "w-[76px]",  mono: true },
]

const PASTEL_COLS = [
  "bg-sky-50/80 dark:bg-sky-950/30",
  "bg-violet-50/60 dark:bg-violet-950/20",
  "bg-emerald-50/60 dark:bg-emerald-950/20",
  "bg-amber-50/60 dark:bg-amber-950/20",
  "bg-rose-50/60 dark:bg-rose-950/20",
  "bg-cyan-50/60 dark:bg-cyan-950/20",
  "bg-lime-50/60 dark:bg-lime-950/20",
]

function Cell({ value, col, colIdx }: { value: string; col: typeof COLS[number]; colIdx: number }) {
  const [expanded, setExpanded] = React.useState(false)
  const isAnswer = col.key === "answer"
  const isActive = col.key === "is_active"

  return (
    <td
      className={cn(
        "border border-black/10 px-2 py-1.5 text-[11px] align-top dark:border-white/10",
        col.width,
        PASTEL_COLS[colIdx % PASTEL_COLS.length],
        col.mono && "font-mono",
      )}
    >
      {isActive ? (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          {value}
        </span>
      ) : isAnswer ? (
        <span>
          <span className={cn("leading-5 text-zinc-700 dark:text-zinc-300", !expanded && "line-clamp-3")}>
            {value}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 block text-[10px] text-cyan-600 hover:underline dark:text-cyan-400"
          >
            {expanded ? "折りたたむ" : "全文を見る"}
          </button>
        </span>
      ) : (
        <span className="leading-5 text-zinc-700 dark:text-zinc-300">{value}</span>
      )}
    </td>
  )
}

export function FaqCsvExampleModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="m-auto gap-2 rounded-full hover:shadow-xl hover:text-emerald-500">
          <TableIcon className="size-4 text-cyan-600 " />
          サンプルcsvを見る→
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90dvh] max-w-[95vw] flex-col gap-0 overflow-hidden p-0 xl:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-black/10 px-5 py-4 dark:border-white/10">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sheet className="size-4 text-emerald-600" />
            CSVサンプル — knotic FAQデータ（{rows.length}行）
          </DialogTitle>
          <p className="text-[12px] text-muted-foreground">
            このサイトのFAQコンテンツを推奨列構成に当てはめた例です。実際のCSVファイルとして利用可能な形式です。
          </p>
        </DialogHeader>

        {/* 凡例 */}
        <div className="shrink-0 border-b border-black/10 bg-zinc-50 px-5 py-2.5 dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
            <span><span className="font-semibold text-zinc-800 dark:text-zinc-100">faq_id</span> — ユニークID（カテゴリ番号-連番）</span>
            <span><span className="font-semibold text-zinc-800 dark:text-zinc-100">keywords</span> — AIが検索精度を上げるためのタグ（カンマ区切り）</span>
            <span><span className="font-semibold text-zinc-800 dark:text-zinc-100">is_active</span> — FALSEにすると廃止扱い（AIが参照しなくなる）</span>
          </div>
        </div>

        {/* テーブル（横＋縦スクロール） */}
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-max border-collapse">
            <thead className="sticky top-0 z-10">
              {/* Excel風のアルファベット列ヘッダー */}
              <tr>
                <th className="w-8 border border-black/15 bg-zinc-200 px-2 py-1 text-[10px] text-zinc-400 dark:border-white/15 dark:bg-slate-800">
                  #
                </th>
                {COLS.map((col, i) => (
                  <th
                    key={col.key}
                    className={cn(
                      "border border-black/15 px-2 py-1 text-center text-[10px] font-bold uppercase text-zinc-500 dark:border-white/15 dark:text-zinc-400",
                      PASTEL_COLS[i % PASTEL_COLS.length],
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </th>
                ))}
              </tr>
              {/* 列名行 */}
              <tr>
                <th className="w-8 border border-black/15 bg-zinc-100 px-2 py-1.5 text-[10px] text-zinc-400 dark:border-white/15 dark:bg-slate-800/60" />
                {COLS.map((col, i) => (
                  <th
                    key={col.key}
                    className={cn(
                      "border border-black/15 px-2 py-1.5 text-left text-[11px] font-semibold text-zinc-800 dark:border-white/15 dark:text-zinc-100",
                      col.width,
                      col.mono && "font-mono",
                      PASTEL_COLS[i % PASTEL_COLS.length],
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={row.faq_id} className="group">
                  {/* 行番号 */}
                  <td className="border border-black/10 bg-zinc-50 px-2 py-1.5 text-center font-mono text-[10px] text-zinc-400 group-hover:bg-zinc-100 dark:border-white/10 dark:bg-slate-800/40 dark:group-hover:bg-slate-700/40">
                    {rowIdx + 2}
                  </td>
                  {COLS.map((col, colIdx) => (
                    <Cell key={col.key} value={row[col.key]} col={col} colIdx={colIdx} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* フッター */}
        <div className="shrink-0 border-t border-black/10 bg-zinc-50 px-5 py-3 dark:border-white/10 dark:bg-slate-900/60">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            このCSVをファイルとしてダウンロードし、knoticのソース登録画面からアップロードするとそのまま利用できます。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
