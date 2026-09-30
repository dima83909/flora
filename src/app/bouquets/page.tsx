import type { Metadata } from "next"

import { CatalogView } from "@/components/catalog/catalog-view"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { getCategory, isCategorySlug } from "@/data/catalog"

type SearchParams = PageProps<"/bouquets">["searchParams"]

async function getCategoryFromParams(searchParams: SearchParams) {
  const { category } = await searchParams
  const slug = Array.isArray(category) ? category[0] : category
  return isCategorySlug(slug) ? getCategory(slug) : undefined
}

export async function generateMetadata({ searchParams }: PageProps<"/bouquets">): Promise<Metadata> {
  const category = await getCategoryFromParams(searchParams)
  const title = category ? `${category.name} з доставкою по Києву` : "Каталог букетів з доставкою по Києву"
  const description = category
    ? `${category.description}. Фото букета перед доставкою, доставка по Києву того ж дня.`
    : "Авторські букети, троянди, півонії, композиції та квіти в коробках. Фото перед доставкою, доставка по Києву того ж дня."
  const canonical = category ? `/bouquets?category=${category.slug}` : "/bouquets"

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  }
}

export default async function CatalogPage({ searchParams }: PageProps<"/bouquets">) {
  // Reading searchParams renders the page per request, so filters from the URL are in the initial HTML
  const category = await getCategoryFromParams(searchParams)

  const crumbs = [
    { name: "Головна", href: "/" },
    { name: "Каталог", href: "/bouquets" },
    ...(category ? [{ name: category.name, href: `/bouquets?category=${category.slug}` }] : []),
  ]

  return (
    <>
      <Breadcrumbs items={crumbs} className="container-page pt-6 md:pt-8" />
      <CatalogView />
    </>
  )
}
