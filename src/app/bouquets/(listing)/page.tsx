import type { Metadata } from "next"
import { connection } from "next/server"

import { CatalogView } from "@/components/catalog/catalog-view"
import { getCategory } from "@/data/catalog"
import { catalogTitle, isRefinedListing, parseFilters } from "@/lib/catalog"

export async function generateMetadata({ searchParams }: PageProps<"/bouquets">): Promise<Metadata> {
  const raw = await searchParams
  const filters = parseFilters({
    get: (name) => {
      const value = raw[name]
      return (Array.isArray(value) ? value[0] : value) ?? null
    },
  })
  const category = filters.category ? getCategory(filters.category) : undefined

  const title = catalogTitle(category)
  const description = category
    ? `${category.description}. Доставка по Києву${category.slug === "gifts" ? " разом із букетом або окремо" : ", фото букета перед відправкою"}.`
    : "Авторські букети, троянди, півонії, композиції, квіти в коробках і подарунки. Доставка по Києву, фото букета перед відправкою."
  const canonical = category ? `/bouquets?category=${category.slug}` : "/bouquets"

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
    // Search, sorting and price filters are variations of the canonical listing
    robots: isRefinedListing(filters) ? { index: false, follow: true } : undefined,
  }
}

export default async function CatalogPage() {
  // Filters live in the URL: render per request so the initial HTML matches them
  await connection()
  return <CatalogView />
}
