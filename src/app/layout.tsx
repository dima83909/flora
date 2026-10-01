import type { Metadata, Viewport } from "next"
import { Commissioner, Literata } from "next/font/google"

import { siteConfig } from "@/config/site"

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

// Prerendered storefront pages (and the 404 page) refresh catalogue data from the database
// at most every 5 minutes. Admin pages read the session cookie, so they are never prerendered.
export const revalidate = 300

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
}

// Fonts and document shell only: the storefront and the admin panel bring their own chrome
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className={`${literata.variable} ${commissioner.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
