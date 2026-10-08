import type { Metadata } from "next"
import { connection } from "next/server"

import { CatalogView } from "@/components/catalog/catalog-view"
import { categoryHref } from "@/config/site"
import { catalogTitle, isRefinedListing, parseFilters } from "@/lib/catalog"
import { pageOpenGraph } from "@/lib/metadata"
import { canonicalPath } from "@/lib/structured-data"
import { getCategories, getProductSummaries } from "@/server/catalog"

const listFormat = new Intl.ListFormat("uk", { type: "conjunction" })

export async function generateMetadata({ searchParams }: PageProps<"/bouquets">): Promise<Metadata> {
  const [raw, categories] = await Promise.all([searchParams, getCategories()])
  const filters = parseFilters(
    {
      get: (name) => {
        const value = raw[name]
        return (Array.isArray(value) ? value[0] : value) ?? null
      },
    },
    categories.map((c) => c.slug)
  )
  const category = filters.category ? categories.find((c) => c.slug === filters.category) : undefined

  const title = catalogTitle(category)
  const description = category
    ? `${category.description}. Доставка по Україні.`
    : `${listFormat.format(categories.map((c, i) => (i ? c.name.toLocaleLowerCase("uk") : c.name)))}. Доставка по Україні.`
  const canonical = canonicalPath(category ? categoryHref(category.slug) : "/bouquets")

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: pageOpenGraph({ title, description, url: canonical }),
    // Search, sorting and price filters are variations of the canonical listing
    robots: isRefinedListing(filters) ? { index: false, follow: true } : undefined,
  }
}

export default async function CatalogPage() {
  // Filters live in the URL: render per request so the initial HTML matches them
  await connection()
  // The same summaries the layout passes to the cart and search, so the page carries them once
  const [products, categories] = await Promise.all([getProductSummaries(), getCategories()])
  return <CatalogView products={products} categories={categories} />
}
