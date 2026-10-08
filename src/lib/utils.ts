import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { MINOR_UNITS_PER_UAH, toMinor } from "@/lib/money"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const wholePriceFormatter = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 })
const exactPriceFormatter = new Intl.NumberFormat("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Formats a price in hryvnias: 2 450 ₴, or 2 450,50 ₴ when it has kopiykas. Never rounds to
 * whole hryvnias, so the storefront shows the same amount the order and the admin panel do.
 */
export function formatPrice(value: number) {
  const minor = toMinor(value)
  const formatter = minor % MINOR_UNITS_PER_UAH === 0 ? wholePriceFormatter : exactPriceFormatter
  return `${formatter.format(minor / MINOR_UNITS_PER_UAH)} ₴`
}
