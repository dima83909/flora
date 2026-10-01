import "server-only"

import { headers } from "next/headers"

/**
 * Client address for rate limits. Forwarding headers are client-controlled unless a
 * reverse proxy overwrites them, so they are used only when TRUST_PROXY=1 (see README).
 * Otherwise the address is unknown (null) and limits fall back to per-login / per-phone only.
 */
export async function getClientIp() {
  if (process.env.TRUST_PROXY !== "1") return null
  const list = await headers()
  return list.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) || list.get("x-real-ip")?.slice(0, 64) || null
}
