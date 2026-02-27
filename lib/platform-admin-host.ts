const ADMIN_SUBDOMAIN_PREFIX = "operations.knotic."

function normalizeHost(rawHost: string) {
  return rawHost.trim().toLowerCase().split(":")[0] ?? ""
}

export function isPlatformAdminHost(rawHost: string) {
  const host = normalizeHost(rawHost)
  return host.startsWith(ADMIN_SUBDOMAIN_PREFIX)
}

export function isPlatformAdminAccessHost(rawHost: string) {
  const host = normalizeHost(rawHost)
  return isPlatformAdminHost(host) || host === "localhost" || host === "127.0.0.1"
}

export function getPlatformAdminSubdomainPrefix() {
  return ADMIN_SUBDOMAIN_PREFIX
}
