import type { Metadata } from "next"

import { Categories } from "@/components/home/categories"
import { Delivery } from "@/components/home/delivery"
import { FloristCta } from "@/components/home/florist-cta"
import { Hero } from "@/components/home/hero"
import { PopularBouquets } from "@/components/home/popular-bouquets"
import { canonicalPath } from "@/lib/structured-data"

export const metadata: Metadata = {
  alternates: { canonical: canonicalPath("/") },
  openGraph: { url: canonicalPath("/") },
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
