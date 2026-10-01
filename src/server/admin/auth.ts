import "server-only"

import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { getDb } from "@/server/db"
import { checkLoginAllowed, clearLoginFailures, recordLoginFailure } from "@/server/admin/login-throttle"
import { decoyHash, PASSWORD_MAX_LENGTH, verifyPassword } from "@/server/admin/password"
import { createSession, destroySession, readSession } from "@/server/admin/session"

export const ADMIN_LOGIN_PATH = "/admin/login"
export const ADMIN_HOME_PATH = "/admin/orders"

export type CurrentAdmin = NonNullable<Awaited<ReturnType<typeof readSession>>>

/** Session lookup, deduplicated within one render */
export const getCurrentAdmin = cache(readSession)

/**
 * The single authorisation gate for everything under /admin. Every admin page,
 * server action and data function calls it; without a valid session it redirects
 * to the sign-in page and nothing after the call runs.
 */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin()
  if (!admin) redirect(ADMIN_LOGIN_PATH)
  return admin
}

const credentialsSchema = z.object({
  login: z.string().trim().toLowerCase().min(1).max(100),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
})

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "throttled"; retryAfterMinutes: number }

/**
 * Client address for the sign-in limits. Forwarding headers are client-controlled unless a
 * reverse proxy overwrites them, so they are used only when TRUST_PROXY=1 (see README).
 * Otherwise the address is unknown (null) and the limits count per login only.
 */
async function clientIp() {
  if (process.env.TRUST_PROXY !== "1") return null
  const list = await headers()
  return list.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) || list.get("x-real-ip")?.slice(0, 64) || null
}

export async function signIn(input: unknown): Promise<SignInResult> {
  const parsed = credentialsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, reason: "invalid" }
  const { login, password } = parsed.data

  const ip = await clientIp()
  const throttle = await checkLoginAllowed(login, ip)
  if (!throttle.allowed) return { ok: false, reason: "throttled", retryAfterMinutes: throttle.retryAfterMinutes }

  const admin = await getDb().adminUser.findUnique({
    where: { login },
    select: { id: true, passwordHash: true, isActive: true },
  })
  // Unknown and inactive logins cost the same time and give the same answer
  const valid = await verifyPassword(password, admin?.passwordHash ?? (await decoyHash()))
  if (!admin || !admin.isActive || !valid) {
    await recordLoginFailure(login, ip)
    return { ok: false, reason: "invalid" }
  }

  await clearLoginFailures(login, ip)
  await getDb().adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
  await createSession(admin.id)
  return { ok: true }
}

export async function signOut() {
  await destroySession()
}
