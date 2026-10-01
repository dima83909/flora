import { describe, expect, it } from "vitest"

import { fromMinor, toMinor } from "@/lib/money"

describe("money", () => {
  it("converts between hryvnias and kopiykas", () => {
    expect(toMinor(1850)).toBe(185000)
    expect(fromMinor(185000)).toBe(1850)
  })

  it("rounds away floating-point noise", () => {
    expect(toMinor(19.99)).toBe(1999)
    expect(toMinor(0.1 + 0.2)).toBe(30)
  })

  it("round-trips whole kopiykas", () => {
    for (const minor of [0, 1, 99, 100, 123456]) expect(toMinor(fromMinor(minor))).toBe(minor)
  })
})
