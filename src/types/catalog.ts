import type { FlowerArtContainer, FlowerArtVariant } from "@/components/brand/flower-art"
import type { GiftArtVariant } from "@/components/brand/gift-art"

export type Availability = "in_stock" | "low_stock" | "preorder" | "out_of_stock"

/** Placeholder illustration until product photography is available */
export type ProductVisual =
  | { kind: "bouquet"; variant: FlowerArtVariant; container?: FlowerArtContainer }
  | { kind: "gift"; variant: GiftArtVariant }

export type Product = {
  /** Latin, SEO-friendly URL segment: /bouquets/[slug] */
  slug: string
  name: string
  /** Slug of the category; categories come from the database */
  category: string
  /** Short list of the main stems, shown on cards */
  composition: string
  /** Full stem list with quantities, shown on the product page */
  stems: string[]
  description: string
  /** Care tips shown on the product page; empty for non-floral gifts */
  careInstructions: string[]
  /** Height and diameter, or dimensions for gifts */
  size: string
  price: number
  /** Price before discount; presence marks the product as on sale */
  oldPrice?: number
  /** "Новинка" badge, set by a manager */
  isNew?: boolean
  /** "Популярне" badge, set by a manager */
  isPopular?: boolean
  availability: Availability
  /** Days needed to source flowers, for preorder items */
  leadDays?: number
  /** Tie-breaker in sorting for products added on the same day; higher first */
  popularity: number
  /** ISO timestamp the product was added (seed fixtures give a date only); drives the "new" and default sorts */
  addedAt: string
  visual: ProductVisual
  /**
   * Real product photography, root-relative (e.g. "/images/products/pink-peony-1.jpg")
   * or absolute URLs. Feeds structured data and Open Graph once available;
   * the illustrated `visual` stays as a fallback.
   */
  images?: string[]
}

/**
 * The part of a product that cards, the cart, header search, favourites and navigation
 * need. Every storefront page ships the whole catalogue in this shape, so the long texts
 * (description, care tips, size) stay on the server and only the main photo is kept.
 */
export type ProductSummary = Pick<
  Product,
  | "slug"
  | "name"
  | "category"
  | "composition"
  | "stems"
  | "price"
  | "oldPrice"
  | "isNew"
  | "isPopular"
  | "availability"
  | "leadDays"
  | "popularity"
  | "addedAt"
  | "visual"
  // The main photo only, when there is one
  | "images"
>

export type Category = {
  slug: string
  name: string
  description: string
  /** Illustration used on the homepage category tile when there is no photograph */
  visual: ProductVisual
  /** Photograph for the category tile, root-relative; usually a product's main photo */
  image?: string
  /** Shown on the homepage */
  featured?: boolean
  /** Linked from the main header navigation */
  inNavigation?: boolean
}

/** Category with the lowest price among its published products */
export type CategoryWithPrice = Category & { priceFrom: number }
