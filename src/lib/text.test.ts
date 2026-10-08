import { describe, expect, it } from "vitest"

import { normalizeSearchQuery, pluralize, SEARCH_QUERY_MAX, singleLine } from "@/lib/text"

describe("singleLine", () => {
  it("trims and collapses whitespace", () => {
    expect(singleLine("  Біла \t Церква \n")).toBe("Біла Церква")
  })
})

describe("normalizeSearchQuery", () => {
  it("is empty for a missing value", () => {
    expect(normalizeSearchQuery(undefined)).toBe("")
  })

  it("collapses whitespace and caps the length", () => {
    expect(normalizeSearchQuery("  050   123 ")).toBe("050 123")
    expect(normalizeSearchQuery("я".repeat(SEARCH_QUERY_MAX + 20))).toHaveLength(SEARCH_QUERY_MAX)
  })
})

describe("pluralize", () => {
  const forms: [string, string, string] = ["товар", "товари", "товарів"]
  it.each([
    [1, "товар"],
    [2, "товари"],
    [4, "товари"],
    [5, "товарів"],
    [11, "товарів"],
    [12, "товарів"],
    [21, "товар"],
    [22, "товари"],
    [25, "товарів"],
  ])("uses the right form for %i", (count, expected) => {
    expect(pluralize(count, forms)).toBe(expected)
  })
})
