import type { MetadataRoute } from "next"

import { getProductSlugs } from "@/server/catalog"
import { absoluteUrl } from "@/lib/structured-data"

// Picks up products added to the database without a rebuild
export const revalidate = 300

/**
 * Public, indexable pages only. Categories are filters on /bouquets (?category=…),
 * not separate routes, so they are not listed. /favorites is personal and noindex.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getProductSlugs()
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/bouquets"), changeFrequency: "daily", priority: 0.9 },
    ...slugs.map((slug) => ({
      url: absoluteUrl(`/bouquets/${slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]
}
