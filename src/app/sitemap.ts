import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"
import { absoluteUrl } from "@/lib/structured-data"
import { getProductSlugs } from "@/server/catalog"

// Picks up products added to the database without a rebuild
export const revalidate = 300

/**
 * Public, indexable pages only. Categories are filters on /bouquets (?category=…),
 * not separate routes, so they are not listed. /favorites is personal and noindex.
 * Sitemaps need absolute URLs: until the real domain is configured it is empty.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteConfig.url) return []
  const url = (path: string) => absoluteUrl(path)!
  const slugs = await getProductSlugs()
  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/bouquets"), changeFrequency: "daily", priority: 0.9 },
    ...slugs.map((slug) => ({
      url: url(`/bouquets/${slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]
}
