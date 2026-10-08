"use client"

import { usePathname, useSearchParams } from "next/navigation"

import { useCatalog } from "@/components/catalog/catalog-provider"
import { categoryHref, type NavItem } from "@/config/site"

/**
 * Resolves which main navigation item matches the current URL.
 * Category pages and product pages highlight their category when it is in the menu,
 * otherwise the catalogue item. Uses search params, so render inside <Suspense>.
 */
export function useActiveNavHref(items: NavItem[]): string | null {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { getProduct } = useCatalog()

  const inMenu = (category: string | null | undefined) =>
    category ? items.find((item) => item.href === categoryHref(category))?.href : undefined

  if (pathname === "/bouquets") {
    return inMenu(searchParams.get("category")) ?? "/bouquets"
  }
  if (pathname.startsWith("/bouquets/")) {
    // Slugs are Latin, so the segment needs no decoding (and a broken encoding cannot throw)
    const product = getProduct(pathname.split("/")[2] ?? "")
    return inMenu(product?.category) ?? "/bouquets"
  }
  return null
}
