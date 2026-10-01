import "server-only"

import type { Prisma } from "@/generated/prisma/client"
import { canTransition, type OrderStatusValue } from "@/lib/order-status"
import { getDb } from "@/server/db"

/** Minimal public confirmation: the success page shows the number only, never customer data */
export async function orderExists(number: number) {
  if (!Number.isSafeInteger(number) || number < 1) return false
  const order = await getDb().order.findUnique({ where: { number }, select: { id: true } })
  return order !== null
}

/*
 * Manager queries. They perform no authorisation themselves: application code must
 * reach them only through `@/server/admin/orders`, which checks the admin session
 * first. Nothing customer-facing may import the functions below.
 */

/** Matches an order number, or part of a customer name, city or phone */
function searchWhere(query: string | undefined): Prisma.OrderWhereInput {
  const q = query?.trim().replace(/\s+/g, " ").slice(0, 100)
  if (!q) return {}

  const or: Prisma.OrderWhereInput[] = [
    { customerName: { contains: q, mode: "insensitive" } },
    { customerCity: { contains: q, mode: "insensitive" } },
  ]

  const number = /^[#№]?\s*(\d{1,9})$/.exec(q)
  if (number) or.push({ number: Number(number[1]) })

  // Phones are stored as +380501234567, so "050 123" and "(050) 123" match by digits
  const digits = q.replace(/\D/g, "")
  if (digits.length >= 3 && /^[\d\s()+-]+$/.test(q)) or.push({ customerPhone: { contains: digits } })

  return { OR: or }
}

export type OrderSearch = {
  status?: OrderStatusValue
  query?: string
  skip?: number
  take?: number
}

export async function searchOrders({ status, query, skip = 0, take = 25 }: OrderSearch = {}) {
  const where: Prisma.OrderWhereInput = { ...searchWhere(query), ...(status ? { status } : {}) }
  const db = getDb()
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { number: "desc" }],
      skip,
      take,
      include: { _count: { select: { items: true } } },
    }),
    db.order.count({ where }),
  ])
  return { orders, total }
}

/** Orders per status, within the same search, for the filter tabs */
export async function countOrdersByStatus(query?: string) {
  const groups = await getDb().order.groupBy({ by: ["status"], where: searchWhere(query), _count: { _all: true } })
  return Object.fromEntries(groups.map((group) => [group.status, group._count._all])) as Partial<
    Record<OrderStatusValue, number>
  >
}

export function getOrderByNumber(number: number) {
  return getDb().order.findUnique({
    where: { number },
    include: { items: { orderBy: { createdAt: "asc" } } },
  })
}

export type StatusChangeResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_allowed" | "stale"; current?: OrderStatusValue }

/**
 * Moves an order along the workflow. `from` is the status the manager was looking at:
 * the update only applies while the order is still in it, so two managers (or two
 * tabs) cannot both move the same order.
 */
export async function transitionOrderStatus(
  number: number,
  from: OrderStatusValue,
  to: OrderStatusValue
): Promise<StatusChangeResult> {
  if (!canTransition(from, to)) return { ok: false, reason: "not_allowed" }

  const db = getDb()
  const { count } = await db.order.updateMany({ where: { number, status: from }, data: { status: to } })
  if (count === 1) return { ok: true }

  const order = await db.order.findUnique({ where: { number }, select: { status: true } })
  if (!order) return { ok: false, reason: "not_found" }
  return { ok: false, reason: "stale", current: order.status }
}

/** Returns false when the order does not exist */
export async function setManagerNote(number: number, note: string | null) {
  const { count } = await getDb().order.updateMany({ where: { number }, data: { managerNote: note } })
  return count === 1
}
