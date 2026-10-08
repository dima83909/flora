import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { formatMinor, toMinor } from "@/lib/money"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formats a price in hryvnias: 2 450 ₴, or 2 450,50 ₴ when it has kopiykas (see formatMinor) */
export function formatPrice(value: number) {
  return formatMinor(toMinor(value))
}
