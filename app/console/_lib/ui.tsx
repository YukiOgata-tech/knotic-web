import { Badge } from "@/components/ui/badge"

export function fmtDate(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("ja-JP")
}

export function boolBadge(value: boolean, trueText = "有効", falseText = "無効") {
  return (
    <Badge variant={value ? "default" : "outline"}>
      {value ? trueText : falseText}
    </Badge>
  )
}

export function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

