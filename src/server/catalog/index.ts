import "server-only"

import type { Prisma } from "@/generated/prisma/client"
import {
  DEFAULT_SORT,
  priceRanges,
  productMatchesQuery,
  sortProducts,
  type CatalogFilters,
} from "@/lib/catalog"
import { toMinor } from "@/lib/money"
import {
  toStorefrontCategory,
  toStorefrontProduct,
  type DbProductWithRelations,
} from "@/server/catalog/mappers"
import { getDb } from "@/server/db"
import type { Category, Product } from "@/types/catalog"

/*
 * Server-side catalogue. The only place the storefront reads catalogue data from
 * the database; returns the same Product/Category shapes as the mock data, so pages
 * can switch source without UI changes.
 *
 * Structured filters (category, price, stock) run in SQL. Text search and ordering
 * reuse the storefront's own rules so results match exactly; that is fine for a
 * catalogue of hundreds of items and can move to Postgres full-text search later.
 */

export type ProductFilters = Partial<Omit<CatalogFilters, "favoritesOnly">>

const productInclude = {
  category: { select: { slug: true, name: true } },
  images: { select: { url: true, sortOrder: true } },
} satisfies Prisma.ProductInclude

type ProductRow = DbProductWithRelations & { category: { slug: string; name: string } }

function compact<T>(items: (T | null)[]) {
  return items.filter((item): item is T => item !== null)
}

function buildWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const range = priceRanges.find((r) => r.value === filters.price)
  return {
    isActive: true,
    category: { isActive: true, ...(filters.category ? { slug: filters.category } : {}) },
    ...(range
      ? {
          priceMinor: {
            gte: toMinor(range.min),
            ...(Number.isFinite(range.max) ? { lt: toMinor(range.max) } : {}),
          },
        }
      : {}),
    // "In stock" means ready now: not preorder, not sold out, and tracked stock above zero
    ...(filters.inStockOnly
      ? { availability: "IN_STOCK", OR: [{ stock: null }, { stock: { gt: 0 } }] }
      : {}),
  }
}

async function findProducts(filters: ProductFilters): Promise<Product[]> {
  const rows: ProductRow[] = await getDb().product.findMany({
    where: buildWhere(filters),
    include: productInclude,
  })

  const query = filters.query?.trim() ?? ""
  const matched = rows.flatMap((row) => {
    const product = toStorefrontProduct(row)
    return product && productMatchesQuery(product, query, row.category.name) ? [product] : []
  })

  return sortProducts(matched, filters.sort ?? DEFAULT_SORT)
}

/** Active categories in display order */
export async function getCategories(): Promise<Category[]> {
  const rows = await getDb().category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
  return compact(rows.map(toStorefrontCategory))
}

/** All published products, most popular first */
export function getProducts(): Promise<Product[]> {
  return findProducts({})
}

/** Catalogue listing with the same filters and sorting as /bouquets */
export function filterProducts(filters: ProductFilters): Promise<Product[]> {
  return findProducts(filters)
}

/** Text search across name, composition, stems and category */
export async function searchProducts(query: string, limit?: number): Promise<Product[]> {
  if (!query.trim()) return []
  const found = await findProducts({ query })
  return limit ? found.slice(0, limit) : found
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await getDb().product.findFirst({
    where: { slug, isActive: true, category: { isActive: true } },
    include: productInclude,
  })
  return row ? toStorefrontProduct(row) : null
}

/** Slugs of every published product, e.g. for generateStaticParams and the sitemap */
export async function getProductSlugs(): Promise<string[]> {
  const rows = await getDb().product.findMany({
    where: { isActive: true, category: { isActive: true } },
    select: { slug: true },
    orderBy: { slug: "asc" },
  })
  return rows.map((row) => row.slug)
}
