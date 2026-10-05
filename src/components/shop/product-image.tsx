import Image from "next/image"

import { FlowerArt, type ArtView } from "@/components/brand/flower-art"
import { GiftArt } from "@/components/brand/gift-art"
import { cn } from "@/lib/utils"
import type { ProductVisual } from "@/types/catalog"

type ProductImageProps = {
  visual: ProductVisual
  /** Product photograph (root-relative or absolute URL); the illustration is the fallback */
  src?: string
  /** Alt text for the photograph, or accessible name for the illustration; omit when decorative */
  label?: string
  /** Rendered widths for the photograph, as for next/image */
  sizes?: string
  /** Load the photograph eagerly: only for the main image above the fold */
  preload?: boolean
  /**
   * Skip lazy loading and decode the photograph before the next paint. For listings that rebuild their
   * cards on filter changes: a re-created <img> is cached but decodes asynchronously, so the card
   * would stay blank for a few frames.
   */
  eager?: boolean
  view?: ArtView
  className?: string
}

/**
 * Single entry point for product imagery. Shows the photograph when the product has
 * one and the illustration otherwise. The parent sets the size (an aspect-ratio box).
 */
export function ProductImage({ visual, src, label, sizes = "50vw", preload, eager, view, className }: ProductImageProps) {
  if (src) {
    return (
      <span className="relative block size-full">
        <Image
          src={src}
          alt={label ?? ""}
          fill
          sizes={sizes}
          preload={preload}
          loading={eager ? "eager" : undefined}
          decoding={eager ? "sync" : undefined}
          className={cn("object-cover", className)}
        />
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
