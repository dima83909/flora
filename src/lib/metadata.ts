import type { Metadata } from "next"

import { siteConfig } from "@/config/site"

type OpenGraph = NonNullable<Metadata["openGraph"]>

/** The brand image in app/opengraph-image.png, for pages that define their own Open Graph data */
export const sharedSocialImage = { url: "/opengraph-image.png", width: 1200, height: 630, alt: siteConfig.title }

/**
 * Open Graph data for a page. A page-level `openGraph` replaces the root one entirely
 * (Next.js merges metadata shallowly), so pages build theirs from these defaults to keep
 * the site name, locale and social image.
 */
export function pageOpenGraph(overrides: OpenGraph): OpenGraph {
  return {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    images: [sharedSocialImage],
    ...overrides,
  }
}
