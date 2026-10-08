import { describe, expect, it } from "vitest"

import {
  applyFilters,
  countPanelFilters,
  DEFAULT_SORT,
  discountPercent,
  filtersToSearch,
  isRefinedListing,
  parseFilters,
  productMatchesQuery,
  searchProducts,
  sortProducts,
  type CatalogFilters,
  type SortValue,
} from "@/lib/catalog"
import type { Product } from "@/types/catalog"

function product(overrides: Partial<Product> & Pick<Product, "slug">): Product {
  return {
    name: overrides.slug,
    category: "roses",
    composition: "",
    stems: [],
    description: "",
    careInstructions: [],
    size: "",
    price: 1000,
    availability: "in_stock",
    popularity: 0,
    addedAt: "2026-01-01",
    visual: { kind: "gift", variant: "vase" },
    ...overrides,
  } as Product
}

const noFilters: CatalogFilters = {
  query: "",
  category: null,
  price: null,
  inStockOnly: false,
  favoritesOnly: false,
  sort: DEFAULT_SORT,
}

describe("parseFilters / filtersToSearch", () => {
  it("falls back to defaults for missing and invalid params", () => {
    const filters = parseFilters(new URLSearchParams("price=nope&sort=weird&stock=yes"))
    expect(filters).toEqual(noFilters)
  })

  it("round-trips a full set of filters", () => {
    const filters: CatalogFilters = {
      query: "півонії",
      category: "peonies",
      price: "1500-2500",
      inStockOnly: true,
      favoritesOnly: true,
      sort: "price-desc",
    }
    expect(parseFilters(new URLSearchParams(filtersToSearch(filters)))).toEqual(filters)
  })

  it("writes nothing for the default state", () => {
    expect(filtersToSearch(noFilters)).toBe("")
  })

  it("ignores an unknown category when the known ones are given", () => {
    const params = new URLSearchParams("category=ghost")
    expect(parseFilters(params, ["roses"]).category).toBeNull()
    expect(parseFilters(params).category).toBe("ghost")
  })

  it("counts panel refinements but not category or search", () => {
    expect(countPanelFilters({ ...noFilters, query: "x", category: "roses" })).toBe(0)
    expect(countPanelFilters({ ...noFilters, price: "to-1500", inStockOnly: true })).toBe(2)
  })

  it("marks only refined listings as non-indexable", () => {
    expect(isRefinedListing(noFilters)).toBe(false)
    expect(isRefinedListing({ ...noFilters, category: "roses" })).toBe(false)
    expect(isRefinedListing({ ...noFilters, sort: "new" })).toBe(true)
    expect(isRefinedListing({ ...noFilters, query: "a" })).toBe(true)
  })
})

describe("productMatchesQuery", () => {
  const peony = product({
    slug: "pink-peony",
    name: "Рожева півонія",
    composition: "Півонії, евкаліпт",
    stems: ["Півонія 5 шт", "Евкаліпт"],
  })

  it("matches everything for an empty query", () => {
    expect(productMatchesQuery(peony, "")).toBe(true)
  })

  it("is case-insensitive and requires every word", () => {
    expect(productMatchesQuery(peony, "РОЖЕВА півонія")).toBe(true)
    expect(productMatchesQuery(peony, "півонія тюльпан")).toBe(false)
  })

  it("searches composition, stems and category name", () => {
    expect(productMatchesQuery(peony, "евкаліпт")).toBe(true)
    expect(productMatchesQuery(peony, "півонія", "Букети")).toBe(true)
    expect(productMatchesQuery(peony, "букети", "Букети")).toBe(true)
  })

  it("ignores apostrophes", () => {
    const item = product({ slug: "a", name: "Дарунок з м'ятою" })
    expect(productMatchesQuery(item, "мяту")).toBe(false)
    expect(productMatchesQuery(item, "мятою")).toBe(true)
    expect(productMatchesQuery(item, "м’ятою")).toBe(true)
  })
})

describe("applyFilters", () => {
  const items = [
    product({ slug: "cheap-rose", category: "roses", price: 1000, popularity: 5 }),
    product({ slug: "mid-rose", category: "roses", price: 1500, popularity: 9 }),
    product({ slug: "peony", category: "peonies", price: 2500, popularity: 7 }),
    product({ slug: "luxe", category: "peonies", price: 4000, popularity: 1, availability: "low_stock" }),
    product({ slug: "sold-out", category: "roses", price: 1200, popularity: 99, availability: "out_of_stock" }),
    product({ slug: "later", category: "roses", price: 1300, popularity: 3, availability: "preorder" }),
  ]
  const slugs = (list: Product[]) => list.map((p) => p.slug)

  it("filters by category", () => {
    expect(slugs(applyFilters(items, { ...noFilters, category: "peonies" }, []))).toEqual(["peony", "luxe"])
  })

  it("treats price range bounds as inclusive of min and exclusive of max", () => {
    const result = applyFilters(items, { ...noFilters, price: "1500-2500" }, [])
    expect(slugs(result)).toEqual(["mid-rose"])
    expect(slugs(applyFilters(items, { ...noFilters, price: "from-4000" }, []))).toEqual(["luxe"])
    // Below 1 500 only: ordered by popularity, unavailable product last
    expect(slugs(applyFilters(items, { ...noFilters, price: "to-1500" }, []))).toEqual(["cheap-rose", "later", "sold-out"])
  })

  it("keeps only ready-now products when asked for in-stock", () => {
    const result = slugs(applyFilters(items, { ...noFilters, inStockOnly: true }, []))
    expect(result).not.toContain("sold-out")
    expect(result).not.toContain("later")
    expect(result).toContain("luxe")
  })

  it("keeps only favourites", () => {
    expect(slugs(applyFilters(items, { ...noFilters, favoritesOnly: true }, ["peony"]))).toEqual(["peony"])
  })

  it("matches the query against the category name", () => {
    const result = applyFilters(items, { ...noFilters, query: "півонії" }, [], [{ slug: "peonies", name: "Півонії" }])
    expect(slugs(result)).toEqual(["peony", "luxe"])
  })

  it("sinks unavailable products to the end whatever the sort", () => {
    const result = slugs(applyFilters(items, noFilters, []))
    expect(result[result.length - 1]).toBe("sold-out")
    expect(result[0]).toBe("mid-rose")
  })
})

describe("sortProducts", () => {
  it("sorts by price in both directions", () => {
    const list = () => [product({ slug: "b", price: 20 }), product({ slug: "a", price: 10 }), product({ slug: "c", price: 30 })]
    expect(sortProducts(list(), "price-asc").map((p) => p.slug)).toEqual(["a", "b", "c"])
    expect(sortProducts(list(), "price-desc").map((p) => p.slug)).toEqual(["c", "b", "a"])
  })

  it("sorts newest first", () => {
    const list = [product({ slug: "old", addedAt: "2026-01-01" }), product({ slug: "new", addedAt: "2026-06-01" })]
    expect(sortProducts(list, "new").map((p) => p.slug)).toEqual(["new", "old"])
  })

  describe("gifts in mixed listings", () => {
    const list = () => [
      product({ slug: "popular-candy", category: "gifts", isPopular: true, price: 500, addedAt: "2026-03-01" }),
      product({ slug: "plain-roses", category: "roses", price: 2000, addedAt: "2026-01-01" }),
      product({ slug: "sold-out-peony", category: "peonies", price: 900, availability: "out_of_stock" }),
      product({ slug: "sold-out-candle", category: "gifts", price: 300, availability: "out_of_stock" }),
      product({ slug: "vase", category: "gifts", price: 1200, addedAt: "2026-02-01" }),
    ]
    const order = (sort: SortValue, options?: { search?: boolean }) =>
      sortProducts(list(), sort, options).map((p) => p.slug)

    it("puts gifts after flowers in the popular and new sorts, sold-out items still last", () => {
      const expected = ["plain-roses", "popular-candy", "vase", "sold-out-peony", "sold-out-candle"]
      expect(order("popular")).toEqual(expected)
      expect(order("new")).toEqual(expected)
    })

    it("keeps price sorts in price order", () => {
      expect(order("price-asc")).toEqual(["popular-candy", "vase", "plain-roses", "sold-out-candle", "sold-out-peony"])
      expect(order("price-desc")).toEqual(["plain-roses", "vase", "popular-candy", "sold-out-peony", "sold-out-candle"])
    })

    it("does not push gifts down in search results", () => {
      expect(order("popular", { search: true })).toEqual([
        "popular-candy",
        "vase",
        "plain-roses",
        "sold-out-candle",
        "sold-out-peony",
      ])
    })
  })

  it("orders products added on the same day by time", () => {
    const list = [
      product({ slug: "a-morning", addedAt: "2026-06-01T08:00:00.000Z" }),
      product({ slug: "b-evening", addedAt: "2026-06-01T18:00:00.000Z" }),
    ]
    expect(sortProducts([...list], "new").map((p) => p.slug)).toEqual(["b-evening", "a-morning"])
    expect(sortProducts([...list], "popular").map((p) => p.slug)).toEqual(["b-evening", "a-morning"])
  })

  it("puts popular, then new, then the newest products first by default", () => {
    const list = [
      product({ slug: "plain-old", addedAt: "2026-01-01", popularity: 99 }),
      product({ slug: "plain-recent", addedAt: "2026-06-01" }),
      product({ slug: "new", isNew: true, addedAt: "2026-02-01" }),
      product({ slug: "popular", isPopular: true, addedAt: "2026-01-01" }),
      product({ slug: "popular-new", isPopular: true, isNew: true, addedAt: "2026-01-01" }),
      product({ slug: "sold-out-popular", isPopular: true, availability: "out_of_stock" }),
    ]
    expect(sortProducts(list, "popular").map((p) => p.slug)).toEqual([
      "popular-new",
      "popular",
      "new",
      "plain-recent",
      "plain-old",
      "sold-out-popular",
    ])
  })

  it("breaks ties by popularity, then slug, regardless of input order", () => {
    const a = product({ slug: "a", price: 10, popularity: 1 })
    const b = product({ slug: "b", price: 10, popularity: 1 })
    const c = product({ slug: "c", price: 10, popularity: 5 })
    expect(sortProducts([b, a, c], "price-asc").map((p) => p.slug)).toEqual(["c", "a", "b"])
    expect(sortProducts([c, b, a], "price-asc").map((p) => p.slug)).toEqual(["c", "a", "b"])
  })
})

describe("searchProducts", () => {
  const items = [
    product({ slug: "a", name: "Трояндовий букет", popularity: 1 }),
    product({ slug: "b", name: "Троянди у кошику", popularity: 9 }),
    product({ slug: "c", name: "Піони" }),
  ]

  it("returns nothing for a blank query", () => {
    expect(searchProducts(items, "   ")).toEqual([])
  })

  it("returns the most popular matches first and honours the limit", () => {
    expect(searchProducts(items, "троянд").map((p) => p.slug)).toEqual(["b", "a"])
    expect(searchProducts(items, "троянд", 1).map((p) => p.slug)).toEqual(["b"])
  })

  it("does not push a matching gift behind bouquets", () => {
    const mixed = [
      product({ slug: "bouquet", name: "Букет", composition: "троянди, шоколад", popularity: 1 }),
      product({ slug: "chocolates", name: "Шоколад", category: "gifts", popularity: 9 }),
    ]
    expect(searchProducts(mixed, "шоколад", 1).map((p) => p.slug)).toEqual(["chocolates"])
  })
})

describe("discountPercent", () => {
  it("is null without a higher old price", () => {
    expect(discountPercent({ price: 100 })).toBeNull()
    expect(discountPercent({ price: 100, oldPrice: 100 })).toBeNull()
    expect(discountPercent({ price: 100, oldPrice: 80 })).toBeNull()
  })

  it("rounds to a whole percent", () => {
    expect(discountPercent({ price: 80, oldPrice: 100 })).toBe(20)
    expect(discountPercent({ price: 2, oldPrice: 3 })).toBe(33)
  })
})
