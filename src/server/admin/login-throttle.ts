import "server-only"

import { getDb } from "@/server/db"

/*
 * Brute-force protection for the admin sign-in, backed by the database so it works
 * across server instances without extra infrastructure. Authentication only talks
 * to the three functions below, so this file can be swapped for Redis or an edge
 * rate limiter without touching the rest.
 */

const WINDOW_MS = 15 * 60 * 1000
/** One login from one address: stops guessing a password from a single machine */
const MAX_FAILURES_PER_LOGIN_AND_IP = 5
/**
 * One login from anywhere. Higher than the pair limit so a stranger cannot lock the
 * manager out with a handful of requests, yet still caps a distributed guessing attack.
 */
const MAX_FAILURES_PER_LOGIN = 30
/** One address across all logins: stops trying many accounts */
const MAX_FAILURES_PER_IP = 20
const KEEP_MS = 24 * 60 * 60 * 1000

export type ThrottleDecision = { allowed: true } | { allowed: false; retryAfterMinutes: number }

/** When a counter that reached `limit` lifts: once its oldest counted attempt leaves the window */
function blockedUntil(attempts: { createdAt: Date }[], limit: number) {
  return attempts.length >= limit ? attempts[attempts.length - 1].createdAt.getTime() + WINDOW_MS : 0
}

/**
 * `ip` is null when the client address is unknown (no trusted proxy). Failures then
 * count together under the null address, so the per-login limits still apply.
 */
export async function checkLoginAllowed(login: string, ip: string | null): Promise<ThrottleDecision> {
  const db = getDb()
  const recent = (where: { login?: string; ip?: string | null }, take: number) =>
    db.adminLoginAttempt.findMany({
      where: { ...where, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } },
      orderBy: { createdAt: "desc" },
      take,
      select: { createdAt: true },
    })

  const [byPair, byLogin, byIp] = await Promise.all([
    recent({ login, ip }, MAX_FAILURES_PER_LOGIN_AND_IP),
    recent({ login }, MAX_FAILURES_PER_LOGIN),
    ip ? recent({ ip }, MAX_FAILURES_PER_IP) : [],
  ])

  const until = Math.max(
    blockedUntil(byPair, MAX_FAILURES_PER_LOGIN_AND_IP),
    blockedUntil(byLogin, MAX_FAILURES_PER_LOGIN),
    blockedUntil(byIp, MAX_FAILURES_PER_IP)
  )
  if (until <= Date.now()) return { allowed: true }
  return { allowed: false, retryAfterMinutes: Math.max(1, Math.ceil((until - Date.now()) / 60_000)) }
}

export async function recordLoginFailure(login: string, ip: string | null) {
  const db = getDb()
  await db.adminLoginAttempt.create({ data: { login, ip } })
  // Opportunistic clean-up keeps the table small without a scheduled job
  await db.adminLoginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - KEEP_MS) } } })
}

/** A successful sign-in forgives earlier typos from the same address, not other people's guesses */
export async function clearLoginFailures(login: string, ip: string | null) {
  await getDb().adminLoginAttempt.deleteMany({ where: { login, ip } })
}
