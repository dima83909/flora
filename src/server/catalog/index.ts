import "server-only"

import { unstable_cache } from "next/cache"
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
  toProductSummary,
  toStorefrontCategory,
  toStorefrontProduct,
  type DbProductWithRelations,
} from "@/server/catalog/mappers"
import { getDb } from "@/server/db"
import type { Category, CategoryWithPrice, Product, ProductSummary } from "@/types/catalog"

/*
 * Server-side catalogue: the only place the storefront reads catalogue data from
 * the database. Returns the same plain Product/Category shapes the UI uses, so
 * results can be passed straight to Client Components.
 *
 * Storefront reads go through Next's data cache, tagged CATALOG_CACHE_TAG: pages rendered
 * per request (the /bouquets listing) and ISR regenerations reuse the stored result instead
 * of querying the database. Admin edits invalidate the tag at once (see
 * src/server/admin/products.ts); changes made straight in the database show up within
 * CATALOG_REVALIDATE_SECONDS. On top of that, React `cache()` deduplicates calls within
 * one render, so a layout and a page asking for the same data share one lookup.
 *
 * Structured filters (category, price, stock) run in SQL. Text search and ordering
 * reuse the storefront's own rules so results match exactly; that is fine for a
 * catalogue of hundreds of items and can move to Postgres full-text search later.
 */

export type ProductFilters = Partial<Omit<CatalogFilters, "favoritesOnly">>

/** Tag of every cached catalogue read; revalidate it after changing products or categories */
export const CATALOG_CACHE_TAG = "catalog"

/** Safety net for edits made outside the admin panel (seed, scripts, SQL) */
const CATALOG_REVALIDATE_SECONDS = 300

/**
 * Stores the result in Next's data cache. The cache exists only inside the Next server
 * (Next defines NEXT_RUNTIME there), so scripts such as `db:check` read the database directly.
 * Results are stored as JSON: return plain data, no Dates.
 */
function cachedRead<T>(key: string, read: () => Promise<T>): () => Promise<T> {
  if (!process.env.NEXT_RUNTIME) return read
  return unstable_cache(read, ["catalog", key], {
    tags: [CATALOG_CACHE_TAG],
    revalidate: CATALOG_REVALIDATE_SECONDS,
  })
}

/** Products and categories for Client Components (cart, search, favourites, navigation) */
export type StorefrontCatalog = {
  products: ProductSummary[]
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

  return sortProducts(matched, filters.sort ?? DEFAULT_SORT, { search: Boolean(query) })
}

const readCategories = cachedRead("categories", async (): Promise<Category[]> => {
  const rows = await getDb().category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
  return rows.map(toStorefrontCategory)
})

const readFeaturedCategories = cachedRead("featured-categories", async (): Promise<CategoryWithPrice[]> => {
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

const readProducts = cachedRead("products", () => findProducts({}))

const readFeaturedProducts = cachedRead("featured-products", async (): Promise<Product[]> => {
  const rows = await getDb().product.findMany({
    where: { ...publishedProduct, isFeatured: true },
    include: productInclude,
  })
  return sortProducts(rows.map(toStorefrontProduct), DEFAULT_SORT)
})

/** Active categories in display order */
export const getCategories = cache((): Promise<Category[]> => readCategories())

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  return (await getCategories()).find((category) => category.slug === slug) ?? null
})

/** Homepage categories with the lowest published price in each */
export const getFeaturedCategories = cache((): Promise<CategoryWithPrice[]> => readFeaturedCategories())

/** All published products in the default order */
export const getProducts = cache((): Promise<Product[]> => readProducts())

/**
 * All published products as cards need them, in the default order. One array per render:
 * the layout and the catalogue page pass the same objects, so the page payload carries them once.
 */
export const getProductSummaries = cache(async (): Promise<ProductSummary[]> => {
  return (await getProducts()).map(toProductSummary)
})

/** Catalogue listing with the same filters and sorting as /bouquets; not cached, used by checks */
export function filterProducts(filters: ProductFilters): Promise<Product[]> {
  return findProducts(filters)
}

/** Text search across name, composition, stems and category; not cached, used by checks */
export async function searchProducts(query: string, limit?: number): Promise<Product[]> {
  if (!query.trim()) return []
  const found = await findProducts({ query })
  return limit ? found.slice(0, limit) : found
}

/** Products flagged for the homepage, in the catalogue's default order */
export const getFeaturedProducts = cache(async (limit = HOMEPAGE_FEATURED_LIMIT): Promise<Product[]> => {
  return (await readFeaturedProducts()).slice(0, limit)
})

/** A published product; looked up in the cached catalogue, which every storefront page loads anyway */
export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  return (await getProducts()).find((product) => product.slug === slug) ?? null
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
  return (await getProducts()).map((product) => product.slug).sort()
})

export const getStorefrontCatalog = cache(
  async (): Promise<StorefrontCatalog> => {
    const [products, categories] = await Promise.all([getProductSummaries(), getCategories()])
    return { products, categories }
  }
)
