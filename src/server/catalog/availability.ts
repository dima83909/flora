import type { ProductAvailability } from "@/generated/prisma/enums"
import type { Availability } from "@/types/catalog"

const toStorefront: Record<ProductAvailability, Availability> = {
  IN_STOCK: "in_stock",
  LOW_STOCK: "low_stock",
  PREORDER: "preorder",
  OUT_OF_STOCK: "out_of_stock",
}

/** Database availability → storefront availability */
export function toStorefrontAvailability(availability: ProductAvailability): Availability {
  return toStorefront[availability]
}

const toDb: Record<Availability, ProductAvailability> = {
  in_stock: "IN_STOCK",
  low_stock: "LOW_STOCK",
  preorder: "PREORDER",
  out_of_stock: "OUT_OF_STOCK",
}

/** Storefront availability → database availability */
export function toDbAvailability(availability: Availability): ProductAvailability {
  return toDb[availability]
}
