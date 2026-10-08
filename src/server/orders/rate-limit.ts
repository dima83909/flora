import "server-only"

import type { Prisma } from "@/generated/prisma/client"
import { getDb } from "@/server/db"

/*
 * Order spam protection backed by the database, like the admin sign-in limits. It counts
 * orders that were actually placed, so a customer who hits "unavailable" or a typo is never
 * penalised. The address limit is generous because mobile carriers put many people behind
 * one address; it applies only when the address is known (TRUST_PROXY=1).
 */

const WINDOW_MS = 60 * 60 * 1000
const MAX_ORDERS_PER_PHONE = 5
const MAX_ORDERS_PER_IP = 10
const KEEP_MS = 24 * 60 * 60 * 1000

/** First key of the advisory locks below, so they cannot clash with locks taken for anything else */
const LOCK_NAMESPACE = 41_710

/**
 * Checks the limits and records the order in one step; call it inside the order transaction.
 * Transaction-scoped advisory locks on the phone and the address make concurrent orders from
 * the same customer wait for each other, so a burst cannot all pass the count before the
 * first one is written. The locks and the record go away with the transaction, so an order
 * that fails later (an unavailable item) is not counted. Returns false when over the limit.
 */
export async function reserveOrderSlot(tx: Prisma.TransactionClient, phone: string, ip: string | null) {
  // Always phone first, then address: a fixed order means two transactions never deadlock
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_NAMESPACE}::int, hashtext(${`phone:${phone}`}))`
  if (ip) await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_NAMESPACE}::int, hashtext(${`ip:${ip}`}))`

  const since = new Date(Date.now() - WINDOW_MS)
  const byPhone = await tx.orderAttempt.count({ where: { phone, createdAt: { gte: since } } })
  const byIp = ip ? await tx.orderAttempt.count({ where: { ip, createdAt: { gte: since } } }) : 0
  if (byPhone >= MAX_ORDERS_PER_PHONE || byIp >= MAX_ORDERS_PER_IP) return false

  await tx.orderAttempt.create({ data: { phone, ip } })
  return true
}

/** Opportunistic clean-up, so the table stays small without a scheduled job */
export async function purgeOldOrderAttempts() {
  await getDb().orderAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - KEEP_MS) } } })
}
