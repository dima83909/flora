"use client"

import Link from "next/link"

import { GiftArt } from "@/components/brand/gift-art"
import { useCatalog } from "@/components/catalog/catalog-provider"
import { ProductCard } from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/lib/stores/favorites"
import { pluralize } from "@/lib/text"
import { useHydrated } from "@/lib/use-hydrated"
import type { ProductSummary } from "@/types/catalog"

export function FavoritesView() {
  const hydrated = useHydrated()
  const slugs = useFavorites()
  const { getProduct } = useCatalog()
  // Most recently saved first; slugs of products no longer in the catalogue are skipped
  const items = [...slugs].reverse().flatMap((slug) => {
    const product = getProduct(slug)
    return product ? [product] : ([] as ProductSummary[])
  })

  if (!hydrated) {
    return <div aria-hidden className="mt-10 h-[60vh] md:mt-14" />
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center md:py-20">
        <div className="arch aspect-3/4 w-32 overflow-hidden md:w-40">
          <GiftArt variant="vase" />
        </div>
        <h2 className="mt-8 text-subtitle font-light text-ink">Тут поки порожньо</h2>
        <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-soft">
          Натискайте на сердечко на картці букета, щоб зберегти його й повернутися пізніше. Обране
          зберігається на цьому пристрої.
        </p>
        <Button asChild size="lg" className="mt-7">
          <Link href="/bouquets">Перейти до каталогу</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">
        {items.length} {pluralize(items.length, ["товар", "товари", "товарів"])}. Щоб прибрати товар,
        натисніть на сердечко.
      </p>
      <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:mt-10 md:grid-cols-3 md:gap-y-14 lg:grid-cols-4">
        {items.map((product) => (
          <li key={product.slug} className="flex">
            <ProductCard product={product} headingLevel="h2" />
          </li>
        ))}
      </ul>
    </>
  )
}
