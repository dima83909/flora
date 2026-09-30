"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"

import type { Category, Product } from "@/types/catalog"

type CatalogContextValue = {
  products: Product[]
  categories: Category[]
  getProduct: (slug: string) => Product | undefined
  getCategory: (slug: string) => Category | undefined
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

/**
 * Makes the published catalogue, loaded on the server from the database, available
 * to Client Components that need lookups by slug: cart, header search, favourites
 * and navigation. Receives plain serialisable data only; no database code reaches
 * the browser.
 */
export function CatalogProvider({
  products,
  categories,
  children,
}: {
  products: Product[]
  categories: Category[]
  children: ReactNode
}) {
  const value = useMemo(() => {
    const productsBySlug = new Map(products.map((p) => [p.slug, p]))
    const categoriesBySlug = new Map(categories.map((c) => [c.slug, c]))
    return {
      products,
      categories,
      getProduct: (slug: string) => productsBySlug.get(slug),
      getCategory: (slug: string) => categoriesBySlug.get(slug),
    }
  }, [products, categories])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const value = useContext(CatalogContext)
  if (!value) throw new Error("useCatalog must be used inside <CatalogProvider>")
  return value
}
