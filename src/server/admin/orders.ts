import "server-only"

import { pageCountFor } from "@/lib/admin-list"
import type { OrderStatusValue } from "@/lib/order-status"
import { requireAdmin } from "@/server/admin/auth"
import {
  countOrdersByStatus,
  deleteOrder,
  getOrderByNumber,
  getOrdersVersion,
  getOrderVersion,
  searchOrders,
  setManagerNote,
  transitionOrderStatus,
} from "@/server/orders/queries"

/*
 * Order data for the admin panel. Every function checks the admin session before
 * touching the database, so a page or action that forgets its own check still
 * cannot read or change orders.
 */

export const ORDERS_PAGE_SIZE = 25

export async function listAdminOrders(filters: { status?: OrderStatusValue; query?: string; page: number }) {
  await requireAdmin()
  const [{ orders, total }, counts] = await Promise.all([
    searchOrders({
      status: filters.status,
      query: filters.query,
      skip: (filters.page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
    }),
    countOrdersByStatus(filters.query),
  ])
  return { orders, total, counts, pageCount: pageCountFor(total, ORDERS_PAGE_SIZE) }
}

export async function getAdminOrder(number: number) {
  await requireAdmin()
  return getOrderByNumber(number)
}

export async function changeAdminOrderStatus(number: number, from: OrderStatusValue, to: OrderStatusValue) {
  await requireAdmin()
  return transitionOrderStatus(number, from, to)
}

export async function saveAdminManagerNote(number: number, note: string | null) {
  await requireAdmin()
  return setManagerNote(number, note)
}

export async function deleteAdminOrder(number: number, expectedStatus: OrderStatusValue) {
  await requireAdmin()
  return deleteOrder(number, expectedStatus)
}

/** Fingerprint of the order list, or of one order, for live updates */
export async function getAdminOrdersVersion(number?: number) {
  await requireAdmin()
  return number === undefined ? getOrdersVersion() : getOrderVersion(number)
}
