import type { Metadata } from "next"

import { Benefits } from "@/components/home/benefits"
import { Categories } from "@/components/home/categories"
import { Delivery } from "@/components/home/delivery"
import { FloristCta } from "@/components/home/florist-cta"
import { Hero } from "@/components/home/hero"
import { PopularBouquets } from "@/components/home/popular-bouquets"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <PopularBouquets />
      <Categories />
      <Benefits />
      <Delivery />
      <FloristCta />
    </>
  )
}
