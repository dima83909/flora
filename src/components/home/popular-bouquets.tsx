import Link from "next/link"

import { SectionHeading } from "@/components/shared/section-heading"
import { ProductCard } from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import { HOMEPAGE_FEATURED_LIMIT } from "@/lib/product-schema"
import { getFeaturedProducts } from "@/server/catalog"

export async function PopularBouquets() {
  const products = await getFeaturedProducts(HOMEPAGE_FEATURED_LIMIT)
  if (!products.length) return null

  return (
    <section aria-labelledby="popular-title" className="section-y">
      <div className="container-page">
        <SectionHeading
          id="popular-title"
          title="Букети з каталогу"
          action={
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/bouquets">Усі букети</Link>
            </Button>
          }
        />
        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:mt-16 md:gap-x-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
