import type { ReactNode } from "react"
import type { Viewport } from "next"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
}

type LayoutProps = {
  children: ReactNode
}

export default function HostedChatLayout({ children }: LayoutProps) {
  return children
}
