import "server-only"

import { getDb } from "@/server/db"

/*
 * Brute-force protection for the admin sign-in, backed by the database so it works
 * across server instances without extra infrastructure. Authentication only talks
 * to the three functions below, so this file can be swapped for Redis or an edge
 * rate limiter without touching the rest.
 */

const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES_PER_LOGIN = 5
const MAX_FAILURES_PER_IP = 20
const KEEP_MS = 24 * 60 * 60 * 1000

export type ThrottleDecision = { allowed: true } | { allowed: false; retryAfterMinutes: number }

export async function checkLoginAllowed(login: string, ip: string | null): Promise<ThrottleDecision> {
  const db = getDb()
  const since = new Date(Date.now() - WINDOW_MS)

  const [byLogin, byIp] = await Promise.all([
    db.adminLoginAttempt.findMany({
      where: { login, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: MAX_FAILURES_PER_LOGIN,
      select: { createdAt: true },
    }),
    ip
      ? db.adminLoginAttempt.findMany({
          where: { ip, createdAt: { gte: since } },
          orderBy: { createdAt: "desc" },
          take: MAX_FAILURES_PER_IP,
          select: { createdAt: true },
        })
      : [],
  ])

  // The lock lifts once the oldest attempt counted towards the limit leaves the window
  const blockedUntil = Math.max(
    byLogin.length >= MAX_FAILURES_PER_LOGIN ? byLogin[byLogin.length - 1].createdAt.getTime() + WINDOW_MS : 0,
    byIp.length >= MAX_FAILURES_PER_IP ? byIp[byIp.length - 1].createdAt.getTime() + WINDOW_MS : 0
  )
  if (blockedUntil <= Date.now()) return { allowed: true }
  return { allowed: false, retryAfterMinutes: Math.max(1, Math.ceil((blockedUntil - Date.now()) / 60_000)) }
}

export async function recordLoginFailure(login: string, ip: string | null) {
  const db = getDb()
  await db.adminLoginAttempt.create({ data: { login, ip } })
  // Opportunistic clean-up keeps the table small without a scheduled job
  await db.adminLoginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - KEEP_MS) } } })
}

export async function clearLoginFailures(login: string) {
  await getDb().adminLoginAttempt.deleteMany({ where: { login } })
}
