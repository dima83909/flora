"use client"

import { usePathname, useSearchParams } from "next/navigation"

import { mainNav } from "@/config/site"
import { getProductBySlug } from "@/data/catalog"

/**
 * Resolves which main navigation item matches the current URL.
 * Category pages and product pages highlight their category when it is in the menu,
 * otherwise the catalogue item. Uses search params, so render inside <Suspense>.
 */
export function useActiveNavHref(): string | null {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const categoryHref = (category: string | null | undefined) =>
    mainNav.find((item) => item.href === `/bouquets?category=${category}`)?.href

  if (pathname === "/bouquets") {
    return categoryHref(searchParams.get("category")) ?? "/bouquets"
  }
  if (pathname.startsWith("/bouquets/")) {
    const product = getProductBySlug(pathname.split("/")[2] ?? "")
    return categoryHref(product?.category) ?? "/bouquets"
  }
  return null
}
