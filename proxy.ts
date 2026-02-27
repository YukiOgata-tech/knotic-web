import { NextResponse, type NextRequest } from "next/server"

import { isPlatformAdminHost } from "@/lib/platform-admin-host"
import { updateSession } from "@/lib/supabase/middleware"

function shouldBypassRewrite(pathname: string) {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth")
  )
}

export async function proxy(request: NextRequest) {
  const sessionResponse = await updateSession(request)

  const host = request.headers.get("host") ?? ""
  const isAdminSubdomain = isPlatformAdminHost(host)
  if (!isAdminSubdomain || shouldBypassRewrite(request.nextUrl.pathname)) {
    return sessionResponse
  }

  const rewriteUrl = request.nextUrl.clone()
  if (!rewriteUrl.pathname.startsWith("/sub-domain")) {
    rewriteUrl.pathname = `/sub-domain${rewriteUrl.pathname === "/" ? "" : rewriteUrl.pathname}`
  }

  const rewriteResponse = NextResponse.rewrite(rewriteUrl)
  for (const cookie of sessionResponse.cookies.getAll()) {
    rewriteResponse.cookies.set(cookie)
  }

  return rewriteResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
