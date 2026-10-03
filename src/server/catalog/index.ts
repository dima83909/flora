import "server-only"

import { cache } from "react"

import type { Prisma } from "@/generated/prisma/client"
import {
  DEFAULT_SORT,
  isPurchasable,
  priceRanges,
  productMatchesQuery,
  sortProducts,
  type CatalogFilters,
} from "@/lib/catalog"
import { isGiftCategory } from "@/config/site"
import { fromMinor, toMinor } from "@/lib/money"
import { HOMEPAGE_FEATURED_LIMIT } from "@/lib/product-schema"
import {
  toStorefrontCategory,
  toStorefrontProduct,
  type DbProductWithRelations,
} from "@/server/catalog/mappers"
import { getDb } from "@/server/db"
import type { Category, CategoryWithPrice, Product } from "@/types/catalog"

/*
 * Server-side catalogue: the only place the storefront reads catalogue data from
 * the database. Returns the same plain Product/Category shapes the UI uses, so
 * results can be passed straight to Client Components.
 *
 * Reads are wrapped in React `cache()`, so a layout and a page asking for the same
 * data within one request hit the database once. Freshness of prerendered pages is
 * controlled by the route segment `revalidate` (see src/app/layout.tsx).
 *
 * Structured filters (category, price, stock) run in SQL. Text search and ordering
 * reuse the storefront's own rules so results match exactly; that is fine for a
 * catalogue of hundreds of items and can move to Postgres full-text search later.
 */

export type ProductFilters = Partial<Omit<CatalogFilters, "favoritesOnly">>

/** Products and categories for Client Components (cart, search, favourites, navigation) */
export type StorefrontCatalog = {
  products: Product[]
  categories: Category[]
}

const productInclude = {
  category: { select: { slug: true, name: true } },
  images: { select: { url: true, sortOrder: true } },
} satisfies Prisma.ProductInclude

type ProductRow = DbProductWithRelations & { category: { slug: string; name: string } }

const publishedProduct = { isActive: true, category: { isActive: true } } satisfies Prisma.ProductWhereInput

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
    // "In stock" means ready now: not preorder and not sold out
    ...(filters.inStockOnly ? { availability: { in: ["IN_STOCK", "LOW_STOCK"] } } : {}),
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
    return productMatchesQuery(product, query, row.category.name) ? [product] : []
  })

  return sortProducts(matched, filters.sort ?? DEFAULT_SORT)
}

/** Active categories in display order */
export const getCategories = cache(async (): Promise<Category[]> => {
  const rows = await getDb().category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
  return rows.map(toStorefrontCategory)
})

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const row = await getDb().category.findFirst({ where: { slug, isActive: true } })
  return row ? toStorefrontCategory(row) : null
})

/** Homepage categories with the lowest published price in each */
export const getFeaturedCategories = cache(async (): Promise<CategoryWithPrice[]> => {
  const db = getDb()
  const [rows, prices] = await Promise.all([
    db.category.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.product.groupBy({ by: ["categoryId"], where: publishedProduct, _min: { priceMinor: true } }),
  ])
  const minByCategory = new Map(prices.map((p) => [p.categoryId, p._min.priceMinor]))
  return rows.flatMap((row) => {
    const min = minByCategory.get(row.id)
    return min != null ? [{ ...toStorefrontCategory(row), priceFrom: fromMinor(min) }] : []
  })
})

/** All published products in the default order */
export const getProducts = cache((): Promise<Product[]> => findProducts({}))

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

/** Products flagged for the homepage, in the catalogue's default order */
export const getFeaturedProducts = cache(async (limit = HOMEPAGE_FEATURED_LIMIT): Promise<Product[]> => {
  const rows = await getDb().product.findMany({
    where: { ...publishedProduct, isFeatured: true },
    include: productInclude,
  })
  return sortProducts(rows.map(toStorefrontProduct), DEFAULT_SORT).slice(0, limit)
})

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const row = await getDb().product.findFirst({
    where: { slug, ...publishedProduct },
    include: productInclude,
  })
  return row ? toStorefrontProduct(row) : null
})

/** Same category first, then other categories except gifts, each in the default order */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const others = (await getProducts()).filter(
    (p) => p.slug !== product.slug && isPurchasable(p.availability)
  )
  const sameCategory = others.filter((p) => p.category === product.category)
  const rest = others.filter((p) => p.category !== product.category && !isGiftCategory(p.category))
  return [...sameCategory, ...rest].slice(0, limit)
}

/** Slugs of every published product, e.g. for generateStaticParams and the sitemap */
export const getProductSlugs = cache(async (): Promise<string[]> => {
  const rows = await getDb().product.findMany({
    where: publishedProduct,
    select: { slug: true },
    orderBy: { slug: "asc" },
  })
  return rows.map((row) => row.slug)
})

export const getStorefrontCatalog = cache(
  async (): Promise<StorefrontCatalog> => {
    const [products, categories] = await Promise.all([getProducts(), getCategories()])
    return { products, categories }
  }
)
