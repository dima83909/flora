import "server-only"

import type { OrderStatus } from "@/generated/prisma/client"
import { getDb } from "@/server/db"

/** Minimal public confirmation: the success page shows the number only, never customer data */
export async function orderExists(number: number) {
  if (!Number.isSafeInteger(number) || number < 1) return false
  const order = await getDb().order.findUnique({ where: { number }, select: { id: true } })
  return order !== null
}

/*
 * Manager queries for the future admin panel. Not exposed by any route yet:
 * they must only be wired up behind admin authentication.
 */

const orderDetails = {
  items: { orderBy: { createdAt: "asc" } },
} as const

export function listOrders({ status, take = 50 }: { status?: OrderStatus; take?: number } = {}) {
  return getDb().order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    include: orderDetails,
  })
}

export function getOrderByNumber(number: number) {
  return getDb().order.findUnique({ where: { number }, include: orderDetails })
}

/** Allowed manager transitions; completed and cancelled orders are final */
const transitions: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["CONTACTED", "CONFIRMED", "CANCELLED"],
  CONTACTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
}

export async function updateOrderStatus(number: number, next: OrderStatus, managerNote?: string) {
  return getDb().$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { number }, select: { status: true } })
    if (!transitions[order.status].includes(next)) {
      throw new Error(`Cannot move order ${number} from ${order.status} to ${next}`)
    }
    return tx.order.update({
      where: { number },
      data: { status: next, ...(managerNote !== undefined ? { managerNote } : {}) },
    })
  })
}
