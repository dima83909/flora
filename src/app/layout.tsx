import type { Metadata, Viewport } from "next"
import { Commissioner, Literata } from "next/font/google"

import { CatalogProvider } from "@/components/catalog/catalog-provider"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { siteConfig } from "@/config/site"
import { getStorefrontCatalog } from "@/server/catalog"

import "./globals.css"

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin", "cyrillic"],
  axes: ["opsz"],
  display: "swap",
})

const commissioner = Commissioner({
  variable: "--font-commissioner",
  subsets: ["latin", "cyrillic"],
  display: "swap",
})

export const metadata: Metadata = {
  // Absolute metadata URLs resolve against the real domain once NEXT_PUBLIC_SITE_URL is set
  ...(siteConfig.url ? { metadataBase: new URL(siteConfig.url) } : {}),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: { card: "summary" },
}

// Prerendered pages refresh catalogue data from the database at most every 5 minutes
export const revalidate = 300

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { products, categories } = await getStorefrontCatalog()

  return (
    <html lang="uk" className={`${literata.variable} ${commissioner.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
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
      </body>
    </html>
  )
}
