import Image from "next/image"

import { FlowerArt, type ArtView } from "@/components/brand/flower-art"
import { GiftArt } from "@/components/brand/gift-art"
import { CardPhoto } from "@/components/shop/card-photo"
import { cn } from "@/lib/utils"
import type { ProductVisual } from "@/types/catalog"

type ProductImageProps = {
  visual: ProductVisual
  /** Product photograph (root-relative or absolute URL); the illustration is the fallback */
  src?: string
  /** Alt text for the photograph, or accessible name for the illustration; omit when decorative */
  label?: string
  /** Card thumbnail of the photograph: shown instead of `src` when given, with `src` as the fallback */
  cardSrc?: string
  /** Rendered widths for the photograph, as for next/image */
  sizes?: string
  /** Load the photograph eagerly: only for the main image above the fold */
  preload?: boolean
  view?: ArtView
  className?: string
}

/**
 * Single entry point for product imagery. Shows the photograph when the product has
 * one and the illustration otherwise. The parent sets the size (an aspect-ratio box).
 */
export function ProductImage({ visual, src, label, cardSrc, sizes = "50vw", preload, view, className }: ProductImageProps) {
  if (src && cardSrc) {
    return (
      <span className="relative block size-full">
        <CardPhoto src={cardSrc} fallbackSrc={src} alt={label ?? ""} sizes={sizes} className={cn("object-cover", className)} />
      </span>
    )
  }
  if (src) {
    return (
      <span className="relative block size-full">
        <Image src={src} alt={label ?? ""} fill sizes={sizes} preload={preload} className={cn("object-cover", className)} />
      </span>
    )
  }
  if (visual.kind === "gift") {
    return <GiftArt variant={visual.variant} view={view} className={className} label={label} />
  }
  return (
    <FlowerArt
      variant={visual.variant}
      container={visual.container}
      view={view}
      className={className}
      label={label}
    />
  )
}
