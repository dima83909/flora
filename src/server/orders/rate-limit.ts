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

export async function isOrderRateLimited(phone: string, ip: string | null) {
  const db = getDb()
  const since = new Date(Date.now() - WINDOW_MS)
  const [byPhone, byIp] = await Promise.all([
    db.orderAttempt.count({ where: { phone, createdAt: { gte: since } } }),
    ip ? db.orderAttempt.count({ where: { ip, createdAt: { gte: since } } }) : 0,
  ])
  return byPhone >= MAX_ORDERS_PER_PHONE || byIp >= MAX_ORDERS_PER_IP
}

/** Records a placed order; call it inside the order transaction */
export async function recordPlacedOrder(tx: Prisma.TransactionClient, phone: string, ip: string | null) {
  await tx.orderAttempt.create({ data: { phone, ip } })
}

/** Opportunistic clean-up, so the table stays small without a scheduled job */
export async function purgeOldOrderAttempts() {
  await getDb().orderAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - KEEP_MS) } } })
}
