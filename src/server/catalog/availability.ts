import type { ProductAvailability } from "@/generated/prisma/enums"
import type { Availability } from "@/types/catalog"

/** At or below this many tracked units the storefront shows "only a few left" */
export const LOW_STOCK_THRESHOLD = 3

type StockFields = {
  availability: ProductAvailability
  stock: number | null
  leadTimeDays: number | null
}

/** Database stock policy → storefront availability */
export function toStorefrontAvailability({ availability, stock }: StockFields): Availability {
  if (availability === "OUT_OF_STOCK") return "out_of_stock"
  if (availability === "PREORDER") return "preorder"
  if (stock === null) return "in_stock"
  if (stock === 0) return "out_of_stock"
  return stock <= LOW_STOCK_THRESHOLD ? "low_stock" : "in_stock"
}

/**
 * Storefront availability → database stock policy. Used by the seed: mock data only
 * says "low stock", so it becomes a tracked stock at the threshold.
 */
export function toStockFields(availability: Availability, leadDays?: number): StockFields {
  switch (availability) {
    case "in_stock":
      return { availability: "IN_STOCK", stock: null, leadTimeDays: null }
    case "low_stock":
      return { availability: "IN_STOCK", stock: LOW_STOCK_THRESHOLD, leadTimeDays: null }
    case "preorder":
      return { availability: "PREORDER", stock: null, leadTimeDays: leadDays ?? 2 }
    case "out_of_stock":
      return { availability: "OUT_OF_STOCK", stock: 0, leadTimeDays: null }
  }
}
