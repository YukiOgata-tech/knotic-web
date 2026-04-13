import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Flyer",
  robots: { index: false, follow: false },
}

export default function FlyerIndexPage() {
  redirect("/flyer/knotic")
}
