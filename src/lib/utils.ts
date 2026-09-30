import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const priceFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
})

/** Formats a price in hryvnias, e.g. 2 450 ₴ */
export function formatPrice(value: number) {
  return `${priceFormatter.format(value)} ₴`
}
