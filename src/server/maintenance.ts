import "server-only"

import { getDb } from "@/server/db"

/*
 * Housekeeping for tables that only grow. Sign-in failures and order attempts are also
 * trimmed opportunistically while the app runs; this catches whatever is left, notably
 * expired admin sessions of managers who never signed out. Run it from cron (see README).
 */

const DAY_MS = 24 * 60 * 60 * 1000

export type CleanupResult = { sessions: number; loginAttempts: number; orderAttempts: number }

/** Deletes expired admin sessions and rate-limit records older than a day */
export async function cleanupExpired(now = new Date()): Promise<CleanupResult> {
  const db = getDb()
  const cutoff = new Date(now.getTime() - DAY_MS)
  const [sessions, loginAttempts, orderAttempts] = await Promise.all([
    db.adminSession.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.adminLoginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    db.orderAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } }),
  ])
  return { sessions: sessions.count, loginAttempts: loginAttempts.count, orderAttempts: orderAttempts.count }
}

export const PURGEABLE_STATUSES = ["COMPLETED", "CANCELLED"] as const

/**
 * Deletes finished (completed or cancelled) orders placed more than `olderThanMonths` months
 * ago; their items go with them. Orders still in progress are never touched. With
 * `dryRun` it only counts what would be deleted.
 */
export async function purgeOrders({
  olderThanMonths,
  dryRun,
  now = new Date(),
}: {
  olderThanMonths: number
  dryRun: boolean
  now?: Date
}) {
  if (!Number.isInteger(olderThanMonths) || olderThanMonths < 1) {
    throw new Error("olderThanMonths must be a whole number of months, at least 1")
  }
  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() - olderThanMonths)

  const where = { status: { in: [...PURGEABLE_STATUSES] }, createdAt: { lt: cutoff } }
  const db = getDb()
  const count = dryRun ? await db.order.count({ where }) : (await db.order.deleteMany({ where })).count
  return { count, cutoff, dryRun }
}
