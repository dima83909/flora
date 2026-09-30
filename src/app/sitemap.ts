import type { MetadataRoute } from "next"

import { products } from "@/data/catalog"
import { absoluteUrl } from "@/lib/structured-data"

/**
 * Public, indexable pages only. Categories are filters on /bouquets (?category=…),
 * not separate routes, so they are not listed. /favorites is personal and noindex.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/bouquets"), changeFrequency: "daily", priority: 0.9 },
    ...products.map((product) => ({
      url: absoluteUrl(`/bouquets/${product.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]
}
