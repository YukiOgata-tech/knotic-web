import type { Viewport } from "next"

/**
 * モバイルでキーボードが出たときにレイアウトビューポートも縮小する。
 * これにより h-dvh がキーボード分を正しく考慮し、
 * チャット入力欄がキーボード直上に固定される。
 */
export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
