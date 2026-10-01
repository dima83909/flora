import { CatalogProvider } from "@/components/catalog/catalog-provider"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { getStorefrontCatalog } from "@/server/catalog"

/** Customer-facing chrome: header, footer and the catalogue data they need */
export async function StorefrontShell({ children }: { children: React.ReactNode }) {
  const { products, categories } = await getStorefrontCatalog()

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-moss px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Перейти до змісту
      </a>
      <CatalogProvider products={products} categories={categories}>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </CatalogProvider>
    </>
  )
}
