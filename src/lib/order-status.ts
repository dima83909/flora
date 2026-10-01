/*
 * Order workflow shared by the admin UI and the server. The UI uses it to decide
 * which buttons to show; the server uses the same table to reject everything else.
 */

export const ORDER_STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const

export type OrderStatusValue = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  NEW: "Нове",
  CONTACTED: "Зв'язалися",
  CONFIRMED: "Підтверджено",
  COMPLETED: "Виконано",
  CANCELLED: "Скасовано",
}

/** Allowed manager transitions; completed and cancelled orders are final */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatusValue, readonly OrderStatusValue[]> = {
  NEW: ["CONTACTED", "CANCELLED"],
  CONTACTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
}

export function isOrderStatus(value: unknown): value is OrderStatusValue {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value)
}

export function canTransition(from: OrderStatusValue, to: OrderStatusValue) {
  return ORDER_STATUS_TRANSITIONS[from].includes(to)
}

export const MANAGER_NOTE_MAX = 2000
