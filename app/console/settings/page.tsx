import {
  updateAuthEmailAction,
  updatePasswordAction,
  updateTenantProfileAction,
} from "@/app/console/actions"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { requireConsoleContext } from "@/app/console/_lib/data"
import { firstParam } from "@/app/console/_lib/ui"
import { SettingsClient } from "@/app/console/settings/settings-client"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ConsoleSettingsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const notice = firstParam(params.notice)
  const error = firstParam(params.error)

  const { supabase, user, membership, impersonation } = await requireConsoleContext()
  if (!membership) return null

  const isEditor = membership.role === "editor"
  const isImpersonating = Boolean(impersonation?.active)

  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("display_name, slug")
    .eq("id", membership.tenant_id)
    .maybeSingle()

  return (
    <div className="grid gap-4">
      <ConsoleAlerts notice={notice} error={error} />

      <SettingsClient
        userEmail={user.email ?? ""}
        tenantDisplayName={tenantRow?.display_name ?? ""}
        tenantSlug={tenantRow?.slug ?? ""}
        role={membership.role}
        isEditor={isEditor}
        isImpersonating={isImpersonating}
        redirectTo="/console/settings"
        updateTenantProfileAction={updateTenantProfileAction}
        updateAuthEmailAction={updateAuthEmailAction}
        updatePasswordAction={updatePasswordAction}
      />
    </div>
  )
}
