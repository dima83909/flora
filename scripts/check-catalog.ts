/**
 * Verifies the database catalogue through the server catalogue service:
 * every mock category and product must round-trip unchanged, and filtering,
 * search and sorting must match the storefront's in-memory implementation.
 *
 * Run with: npm run db:check   (needs DATABASE_URL and a seeded database)
 */
import "dotenv/config"

import { isDeepStrictEqual } from "node:util"

import { categories as mockCategories, products as mockProducts } from "@/data/catalog"
import { applyFilters, sortOptions, priceRanges, type CatalogFilters } from "@/lib/catalog"
import {
  filterProducts,
  getCategories,
  getProductBySlug,
  getProducts,
  searchProducts,
} from "@/server/catalog"
import { getDb } from "@/server/db"

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
    const expected = slugs(applyFilters([...mockProducts], filters, []))
    const actual = slugs(await filterProducts(filters))
    check(isDeepStrictEqual(actual, expected), `filter ${JSON.stringify(filters)}: ${actual} ≠ ${expected}`)
  }

  const search = await searchProducts("півонії", 2)
  check(search.length === 2, `search limit should return 2 items, got ${search.length}`)

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
