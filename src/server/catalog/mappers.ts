import type { Category as DbCategory, Product as DbProduct, ProductImage } from "@/generated/prisma/client"
import { fromMinor } from "@/lib/money"
import { toStorefrontAvailability } from "@/server/catalog/availability"
import type { Category, Product, ProductVisual } from "@/types/catalog"

export type DbProductWithRelations = DbProduct & {
  category: Pick<DbCategory, "slug">
  images: Pick<ProductImage, "url" | "sortOrder">[]
}

const FALLBACK_VISUAL: ProductVisual = { kind: "bouquet", variant: "garden" }

/** The illustration column is JSON; accept only the shapes the frontend can draw */
function toVisual(value: unknown): ProductVisual {
  if (value && typeof value === "object" && "kind" in value && "variant" in value) {
    const v = value as ProductVisual
    if ((v.kind === "bouquet" || v.kind === "gift") && typeof v.variant === "string") return v
  }
  return FALLBACK_VISUAL
}

export function toStorefrontCategory(category: DbCategory): Category {
  return {
    slug: category.slug,
    name: category.name,
    description: category.description ?? "",
    visual: toVisual(category.illustration),
    ...(category.imageUrl ? { image: category.imageUrl } : {}),
    ...(category.isFeatured ? { featured: true } : {}),
    ...(category.showInNav ? { inNavigation: true } : {}),
  }
}

export function toStorefrontProduct(product: DbProductWithRelations): Product {
  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder).map((image) => image.url)
  const label = product.isNew ? "new" : product.isPopular ? "popular" : undefined
  const availability = toStorefrontAvailability(product)

  return {
    slug: product.slug,
    name: product.name,
    category: product.category.slug,
    composition: product.composition,
    stems: product.stems,
    description: product.description,
    careInstructions: product.careInstructions,
    size: product.size ?? "",
    price: fromMinor(product.priceMinor),
    ...(product.compareAtPriceMinor !== null ? { oldPrice: fromMinor(product.compareAtPriceMinor) } : {}),
    ...(label ? { label } : {}),
    availability,
    ...(availability === "preorder" && product.leadTimeDays !== null ? { leadDays: product.leadTimeDays } : {}),
    popularity: product.popularity,
    addedAt: product.createdAt.toISOString().slice(0, 10),
    visual: toVisual(product.illustration),
    ...(images.length ? { images } : {}),
  }
}
