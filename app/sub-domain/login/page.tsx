import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { ShieldCheck } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isPlatformAdminAccessHost } from "@/lib/platform-admin-host"
import { AdminLoginForm } from "@/app/sub-domain/login/admin-login-form"

export const metadata = {
  title: "管理者ログイン | knotic admin",
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const host = (await headers()).get("host") ?? ""
  if (!isPlatformAdminAccessHost(host)) {
    redirect("/")
  }

  // すでにログイン済みかつ管理者権限がある場合はコンソールへ
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const admin = createAdminClient()
    const { data: adminRow } = await admin
      .from("platform_admin_users")
      .select("is_active")
      .eq("user_id", user.id)
      .maybeSingle()

    if (adminRow?.is_active) {
      redirect("/sub-domain")
    }
  }

  const params = (await searchParams) ?? {}
  const errorRaw = params.error
  const error = Array.isArray(errorRaw) ? errorRaw[0] : errorRaw

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      {/* ブランド */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15">
            <ShieldCheck className="size-5 text-amber-400" />
          </div>
          <span className="text-xl font-bold tracking-tight text-amber-400">knotic admin</span>
        </div>
        <p className="text-sm text-slate-400">プラットフォーム管理コンソール</p>
      </div>

      {/* ログインカード */}
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
          <h1 className="mb-1 text-lg font-semibold text-slate-100">管理者ログイン</h1>
          <p className="mb-6 text-xs text-slate-400">
            platform_admin_users に登録されたアカウントでサインインしてください。
          </p>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          ) : null}

          <AdminLoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-slate-600">
          このページは管理者専用です。一般ユーザーは{" "}
          <a href="/" className="text-slate-500 underline hover:text-slate-400">
            こちら
          </a>
        </p>
      </div>
    </div>
  )
}
