import type { FlowerArtContainer, FlowerArtVariant } from "@/components/brand/flower-art"
import type { GiftArtVariant } from "@/components/brand/gift-art"

export type CategorySlug =
  | "bouquets"
  | "roses"
  | "peonies"
  | "tulips"
  | "arrangements"
  | "boxes"
  | "gifts"

export type Availability = "in_stock" | "low_stock" | "preorder" | "out_of_stock"

export type ProductLabel = "new" | "popular"

/** Placeholder illustration until product photography is available */
export type ProductVisual =
  | { kind: "bouquet"; variant: FlowerArtVariant; container?: FlowerArtContainer }
  | { kind: "gift"; variant: GiftArtVariant }

export type Product = {
  /** Latin, SEO-friendly URL segment: /bouquets/[slug] */
  slug: string
  name: string
  category: CategorySlug
  /** Short list of the main stems, shown on cards */
  composition: string
  /** Full stem list with quantities, shown on the product page */
  stems: string[]
  description: string
  /** Height and diameter, or dimensions for gifts */
  size: string
  price: number
  /** Price before discount; presence marks the product as on sale */
  oldPrice?: number
  label?: ProductLabel
  availability: Availability
  /** Days needed to source flowers, for preorder items */
  leadDays?: number
  /** Higher is more popular; drives the default sort */
  popularity: number
  /** ISO date the product was added; drives the "new" sort */
  addedAt: string
  visual: ProductVisual
  /**
   * Real product photography, root-relative (e.g. "/images/products/pink-peony-1.jpg")
   * or absolute URLs. Feeds structured data and Open Graph once available;
   * the illustrated `visual` stays as a fallback.
   */
  images?: string[]
}

export type Category = {
  slug: CategorySlug
  name: string
  description: string
  /** Illustration used on the homepage category tile */
  visual: ProductVisual
  /** Shown on the homepage */
  featured?: boolean
}
