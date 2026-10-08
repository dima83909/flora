import { describe, expect, it } from "vitest"

import { firstParam, listHref, pageCountFor, parsePageParam } from "@/lib/admin-list"

describe("admin list params", () => {
  it("takes the first of repeated values", () => {
    expect(firstParam(["a", "b"])).toBe("a")
    expect(firstParam("a")).toBe("a")
    expect(firstParam(undefined)).toBeUndefined()
  })

  it("reads the page or falls back to the first", () => {
    expect(parsePageParam("3")).toBe(3)
    expect(parsePageParam(["2", "9"])).toBe(2)
    for (const raw of [undefined, "", "0", "-1", "abc", "1234567"]) expect(parsePageParam(raw)).toBe(1)
  })

  it("counts at least one page", () => {
    expect(pageCountFor(0, 25)).toBe(1)
    expect(pageCountFor(25, 25)).toBe(1)
    expect(pageCountFor(26, 25)).toBe(2)
  })

  it("keeps empty filters and the first page out of links", () => {
    expect(listHref("/admin/orders", { status: undefined, q: "", page: 1 })).toBe("/admin/orders")
    expect(listHref("/admin/orders", { status: "NEW", q: "львів", page: 2 })).toBe(
      "/admin/orders?status=NEW&q=%D0%BB%D1%8C%D0%B2%D1%96%D0%B2&page=2"
    )
  })
})
