import { describe, expect, it } from "vitest"

import { MAX_QUANTITY } from "@/lib/cart-limits"
import { customerFieldErrors, normalizePhone, ORDER_LIMITS, orderInputSchema } from "@/lib/order-schema"

const customer = { name: "Олена", phone: "050 123 45 67", city: "Київ" }
const line = { slug: "quiet-harbour", quantity: 1 }

describe("normalizePhone", () => {
  it.each([
    ["+380 50 123 45 67", "+380501234567"],
    ["380501234567", "+380501234567"],
    ["0501234567", "+380501234567"],
    ["(050) 123-45-67", "+380501234567"],
    ["  050 123 45 67  ", "+380501234567"],
    ["+1 202 555 0143", "+12025550143"],
  ])("normalises %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it.each(["", "12345", "abc", "+0501234567", "05012345", "+38050123456789012", "1202 555 0143"])(
    "rejects %j",
    (input) => {
      expect(normalizePhone(input)).toBeNull()
    }
  )

  it("does not treat a national number with a plus sign as Ukrainian", () => {
    expect(normalizePhone("+0501234567")).toBeNull()
  })
})

describe("orderInputSchema", () => {
  it("accepts a valid order and normalises the customer", () => {
    const parsed = orderInputSchema.parse({
      customer: { name: "  Олена   Коваль ", phone: "0501234567", city: " Біла  Церква ", comment: "  після 10:00 " },
      items: [line],
    })
    expect(parsed.customer).toEqual({
      name: "Олена Коваль",
      phone: "+380501234567",
      city: "Біла Церква",
      comment: "після 10:00",
    })
  })

  it("turns a blank comment into undefined", () => {
    expect(orderInputSchema.parse({ customer: { ...customer, comment: "   " }, items: [line] }).customer.comment).toBeUndefined()
  })

  it("strips prices and totals sent by the browser", () => {
    const parsed = orderInputSchema.parse({
      customer,
      items: [{ ...line, price: 1, unitPriceMinor: 1 }],
      subtotal: 1,
    })
    expect(parsed.items[0]).toEqual(line)
    expect(parsed).not.toHaveProperty("subtotal")
  })

  it("keeps the honeypot value so the server can refuse it", () => {
    expect(orderInputSchema.parse({ customer, items: [line], website: "https://spam.example" }).website).toBe(
      "https://spam.example"
    )
    expect(orderInputSchema.parse({ customer, items: [line] }).website).toBeUndefined()
  })

  it.each([
    ["quantity 0", { customer, items: [{ ...line, quantity: 0 }] }],
    ["negative quantity", { customer, items: [{ ...line, quantity: -1 }] }],
    ["fractional quantity", { customer, items: [{ ...line, quantity: 1.5 }] }],
    ["quantity above the limit", { customer, items: [{ ...line, quantity: MAX_QUANTITY + 1 }] }],
    ["string quantity", { customer, items: [{ ...line, quantity: "2" }] }],
    ["empty cart", { customer, items: [] }],
    ["too many lines", { customer, items: Array.from({ length: ORDER_LIMITS.maxLines + 1 }, () => line) }],
    ["uppercase slug", { customer, items: [{ ...line, slug: "Quiet-Harbour" }] }],
    ["slug with a path", { customer, items: [{ ...line, slug: "../etc" }] }],
    ["bad phone", { customer: { ...customer, phone: "12345" }, items: [line] }],
    ["one-letter name", { customer: { ...customer, name: "О" }, items: [line] }],
    ["blank name", { customer: { ...customer, name: "   " }, items: [line] }],
    ["missing city", { customer: { name: customer.name, phone: customer.phone }, items: [line] }],
    ["long comment", { customer: { ...customer, comment: "x".repeat(ORDER_LIMITS.commentMax + 1) }, items: [line] }],
    ["long name", { customer: { ...customer, name: "а".repeat(ORDER_LIMITS.nameMax + 1) }, items: [line] }],
    ["not an object", "DROP TABLE orders"],
    ["null", null],
  ])("rejects %s", (_label, input) => {
    expect(orderInputSchema.safeParse(input).success).toBe(false)
  })

  it("accepts the largest allowed quantity and cart", () => {
    const items = Array.from({ length: ORDER_LIMITS.maxLines }, () => ({ ...line, quantity: MAX_QUANTITY }))
    expect(orderInputSchema.safeParse({ customer, items }).success).toBe(true)
  })
})

describe("customerFieldErrors", () => {
  it("reports the first message per customer field", () => {
    const result = orderInputSchema.safeParse({ customer: { name: "", phone: "12345", city: "" }, items: [line] })
    expect(result.success).toBe(false)
    if (result.success) return
    const errors = customerFieldErrors(result.error)
    expect(Object.keys(errors).sort()).toEqual(["city", "name", "phone"])
    expect(errors.phone).toMatch(/Перевірте номер|Вкажіть телефон/)
  })

  it("ignores problems outside the customer fields", () => {
    const result = orderInputSchema.safeParse({ customer, items: [] })
    expect(result.success).toBe(false)
    if (!result.success) expect(customerFieldErrors(result.error)).toEqual({})
  })
})
