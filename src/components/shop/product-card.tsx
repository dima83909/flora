import Link from "next/link"

import { AddToCartButton } from "@/components/shop/add-to-cart-button"
import { FavoriteButton } from "@/components/shop/favorite-button"
import { Price } from "@/components/shop/price"
import { ProductBadges } from "@/components/shop/product-badges"
import { ProductImage } from "@/components/shop/product-image"
import { availabilityText, isPurchasable } from "@/lib/catalog"
import { cardImageUrl } from "@/lib/product-images"
import { cn } from "@/lib/utils"
import type { Product } from "@/types/catalog"

type ProductCardProps = {
  product: Product
  /** Heading level inside the surrounding section */
  headingLevel?: "h2" | "h3"
}

export function ProductCard({ product, headingLevel: Heading = "h3" }: ProductCardProps) {
  const available = isPurchasable(product.availability)
  const showAvailability = product.availability !== "in_stock"
  const photo = product.images?.[0]

  return (
    <article className="group relative flex w-full flex-col">
      <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-linen">
        {/* Desktop hover zooms in with a CSS transform: gently on a photograph, into the blooms on an illustration */}
        <ProductImage
          visual={product.visual}
          src={photo}
          cardSrc={photo ? cardImageUrl(photo) : undefined}
          label={photo ? product.name : undefined}
          sizes="(min-width: 1024px) 25vw, 50vw"
          className={cn(
            "origin-[50%_38%] transition-transform duration-700 ease-petal",
            photo ? "[@media(hover:hover)]:group-hover:scale-[1.05]" : "[@media(hover:hover)]:group-hover:scale-[1.28]",
            !available && "opacity-60 grayscale-[35%]"
          )}
        />
        <ProductBadges product={product} className="absolute top-2.5 left-2.5 max-w-[calc(100%-3.75rem)] md:top-3 md:left-3" />
        <FavoriteButton slug={product.slug} name={product.name} className="absolute top-1.5 right-1.5 z-10 md:top-2 md:right-2" />
      </div>

      <Heading className="mt-3.5 text-[1.0625rem] leading-snug font-normal text-ink md:mt-4 md:text-xl">
        <Link
          href={`/bouquets/${product.slug}`}
          className="transition-colors after:absolute after:inset-0 after:rounded-2xl group-hover:text-stem focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-stem"
        >
          {product.name}
        </Link>
      </Heading>
      <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-muted-foreground md:text-sm">
        {product.composition}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <div className="min-w-0">
          <Price price={product.price} oldPrice={product.oldPrice} />
          {showAvailability ? (
            <p className={cn("mt-0.5 text-[0.75rem] leading-snug", available ? "text-stem" : "text-muted-foreground")}>
              {availabilityText(product)}
            </p>
          ) : null}
        </div>
        <AddToCartButton product={product} variant="icon" className="relative z-10" />
      </div>
    </article>
  )
}
