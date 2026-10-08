import { describe, expect, it } from "vitest"

import { formatPrice } from "@/lib/utils"

// Intl separates thousands with a narrow no-break space in Ukrainian
const plain = (text: string) => text.replace(/\s/g, " ")

describe("formatPrice", () => {
  it("shows whole hryvnias without decimals", () => {
    expect(plain(formatPrice(2450))).toBe("2 450 ₴")
    expect(plain(formatPrice(0))).toBe("0 ₴")
  })

  it("keeps kopiykas instead of rounding them away", () => {
    expect(plain(formatPrice(1850.5))).toBe("1 850,50 ₴")
    expect(plain(formatPrice(1850.05))).toBe("1 850,05 ₴")
    expect(plain(formatPrice(0.99))).toBe("0,99 ₴")
  })

  it("ignores floating-point noise in sums", () => {
    expect(plain(formatPrice(0.1 + 0.2))).toBe("0,30 ₴")
    expect(plain(formatPrice(1850.5 * 3))).toBe("5 551,50 ₴")
  })
})
