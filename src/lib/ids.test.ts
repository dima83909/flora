import { describe, expect, it } from "vitest"

import { isOrderNumber, isRecordId, ORDER_NUMBER_MAX, parseOrderNumber } from "@/lib/ids"

describe("isRecordId", () => {
  it("accepts CUIDs", () => {
    expect(isRecordId("cmuogxi51000h2dvzh3xpgex0")).toBe(true)
  })

  it.each<unknown>(["", 1, "a-b", "a b", "a".repeat(101), null, undefined])("rejects %j", (value) => {
    expect(isRecordId(value)).toBe(false)
  })
})

describe("order numbers", () => {
  it("parses digits without leading zeros", () => {
    expect(parseOrderNumber("1042")).toBe(1042)
    expect(parseOrderNumber(String(ORDER_NUMBER_MAX))).toBe(ORDER_NUMBER_MAX)
  })

  it.each(["", "0", "01042", "-5", "1.5", "1e3", "1234567890", " 1042"])("does not parse %j", (raw) => {
    expect(parseOrderNumber(raw)).toBeNull()
  })

  it("checks numbers from payloads", () => {
    expect(isOrderNumber(1042)).toBe(true)
    for (const value of [0, -1, 1.5, ORDER_NUMBER_MAX + 1, Number.NaN, "1042", null]) {
      expect(isOrderNumber(value)).toBe(false)
    }
  })
})
