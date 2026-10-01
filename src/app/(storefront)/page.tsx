import type { Metadata } from "next"

import { Categories } from "@/components/home/categories"
import { Delivery } from "@/components/home/delivery"
import { FloristCta } from "@/components/home/florist-cta"
import { Hero } from "@/components/home/hero"
import { PopularBouquets } from "@/components/home/popular-bouquets"
import { siteConfig } from "@/config/site"
import { pageOpenGraph } from "@/lib/metadata"
import { canonicalPath } from "@/lib/structured-data"

export const metadata: Metadata = {
  alternates: { canonical: canonicalPath("/") },
  openGraph: pageOpenGraph({
    title: siteConfig.title,
    description: siteConfig.description,
    url: canonicalPath("/"),
  }),
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <PopularBouquets />
      <Categories />
      <Delivery />
      <FloristCta />
    </>
  )
}
