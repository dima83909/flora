import { describe, expect, it } from "vitest"

import {
  canTransition,
  isOrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUSES,
} from "@/lib/order-status"

describe("canTransition", () => {
  const allowed = [
    ["NEW", "CONTACTED"],
    ["NEW", "CANCELLED"],
    ["CONTACTED", "CONFIRMED"],
    ["CONTACTED", "CANCELLED"],
    ["CONFIRMED", "COMPLETED"],
    ["CONFIRMED", "CANCELLED"],
  ] as const

  it.each(allowed)("allows %s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true)
  })

  it("rejects every other pair, including staying in place", () => {
    const isAllowed = (from: string, to: string) => allowed.some(([a, b]) => a === from && b === to)
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        if (!isAllowed(from, to)) expect(canTransition(from, to), `${from} → ${to}`).toBe(false)
      }
    }
  })

  it("treats completed and cancelled orders as final", () => {
    expect(ORDER_STATUS_TRANSITIONS.COMPLETED).toEqual([])
    expect(ORDER_STATUS_TRANSITIONS.CANCELLED).toEqual([])
  })

  it("has a label for every status", () => {
    for (const status of ORDER_STATUSES) expect(ORDER_STATUS_LABELS[status]).toBeTruthy()
  })
})

describe("isOrderStatus", () => {
  it("accepts known statuses only", () => {
    expect(isOrderStatus("NEW")).toBe(true)
    expect(isOrderStatus("new")).toBe(false)
    expect(isOrderStatus("DELETED")).toBe(false)
    expect(isOrderStatus(null)).toBe(false)
    expect(isOrderStatus(1)).toBe(false)
  })
})
