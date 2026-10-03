/**
 * Verifies the database catalogue through the server catalogue service:
 * every seeded category and product must round-trip unchanged, and filtering,
 * search and sorting must match the storefront's in-memory implementation.
 *
 * Run with: npm run db:check   (needs DATABASE_URL and a seeded database)
 */
import "dotenv/config"

import { isDeepStrictEqual } from "node:util"

import { careByCategory } from "../prisma/seed-data/care"
import { categories as mockCategories, products as fixtureProducts } from "../prisma/seed-data/catalog"
import { photosOnDisk } from "../prisma/seed-data/photos"
import { applyFilters, DEFAULT_SORT, sortOptions, sortProducts, priceRanges, type CatalogFilters } from "@/lib/catalog"
import type { Product } from "@/types/catalog"
import {
  filterProducts,
  getCategories,
  getProductBySlug,
  getProducts,
  getRelatedProducts,
  searchProducts,
} from "@/server/catalog"
import { getDb } from "@/server/db"

// The seed adds per-category care tips and the photographs found on disk to every fixture product
const mockProducts: Product[] = fixtureProducts.map((p) => {
  const images = p.images?.length ? p.images : photosOnDisk(p.slug)
  return { ...p, careInstructions: careByCategory[p.category] ?? [], ...(images.length ? { images } : {}) }
})

const failures: string[] = []
const check = (ok: boolean, message: string) => {
  if (!ok) failures.push(message)
}
const slugs = (items: { slug: string }[]) => items.map((item) => item.slug)

const baseFilters: CatalogFilters = {
  query: "",
  category: null,
  price: null,
  inStockOnly: false,
  favoritesOnly: false,
  sort: "popular",
}

async function main() {
  const categories = await getCategories()
  check(isDeepStrictEqual(categories, mockCategories), "categories differ from mock data")

  const products = await getProducts()
  check(products.length === mockProducts.length, `expected ${mockProducts.length} products, got ${products.length}`)

  for (const mock of mockProducts) {
    const fromDb = await getProductBySlug(mock.slug)
    check(isDeepStrictEqual(fromDb, mock), `product "${mock.slug}" differs from mock data`)
  }
  // Related: purchasable items of the same category, then other non-gift categories, each in the default order
  const byDefaultSort = sortProducts([...mockProducts], DEFAULT_SORT)
  for (const mock of mockProducts) {
    const others = byDefaultSort.filter((p) => p.slug !== mock.slug && p.availability !== "out_of_stock")
    const expected = slugs([
      ...others.filter((p) => p.category === mock.category),
      ...others.filter((p) => p.category !== mock.category && p.category !== "gifts"),
    ]).slice(0, 4)
    const actual = slugs(await getRelatedProducts(mock))
    check(isDeepStrictEqual(actual, expected), `related for "${mock.slug}": ${actual} ≠ ${expected}`)
  }
  check((await getProductBySlug("does-not-exist")) === null, "unknown slug should return null")

  const scenarios: CatalogFilters[] = [
    ...sortOptions.map((o) => ({ ...baseFilters, sort: o.value })),
    ...mockCategories.map((c) => ({ ...baseFilters, category: c.slug })),
    ...priceRanges.map((r) => ({ ...baseFilters, price: r.value, sort: "price-asc" as const })),
    { ...baseFilters, inStockOnly: true },
    { ...baseFilters, query: "евкаліпт" },
    { ...baseFilters, query: "Троянди", category: "boxes" },
    { ...baseFilters, query: "кактус" },
  ]
  for (const filters of scenarios) {
    const expected = slugs(applyFilters([...mockProducts], filters, [], mockCategories))
    const actual = slugs(await filterProducts(filters))
    check(isDeepStrictEqual(actual, expected), `filter ${JSON.stringify(filters)}: ${actual} ≠ ${expected}`)
  }

  const search = await searchProducts("півонії", 2)
  check(search.length === 2, `search limit should return 2 items, got ${search.length}`)

  // "Running low" is set by a manager; no fixture has it, so one product is marked and restored
  const db = getDb()
  const lowSlug = "quiet-harbour"
  const before = await db.product.findUniqueOrThrow({ where: { slug: lowSlug }, select: { availability: true } })
  try {
    await db.product.update({ where: { slug: lowSlug }, data: { availability: "LOW_STOCK" } })
    check((await getProductBySlug(lowSlug))?.availability === "low_stock", "LOW_STOCK should read as low_stock")
    const ready = slugs(await filterProducts({ ...baseFilters, inStockOnly: true }))
    check(ready.includes(lowSlug), "a low-stock product is still in stock for the filter")
  } finally {
    await db.product.update({ where: { slug: lowSlug }, data: { availability: before.availability } })
  }

  console.log(
    `Checked ${categories.length} categories, ${products.length} products and ${scenarios.length} filter scenarios.`
  )
  if (failures.length) {
    console.error(`\n${failures.length} problem(s):\n- ${failures.join("\n- ")}`)
    process.exitCode = 1
  } else {
    console.log("Database catalogue matches the storefront data.")
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => getDb().$disconnect())
