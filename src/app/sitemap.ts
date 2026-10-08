import type { MetadataRoute } from "next"

import { categoryHref, siteConfig } from "@/config/site"
import { absoluteUrl } from "@/lib/structured-data"
import { getCategories, getProductSlugs } from "@/server/catalog"

// Picks up products added to the database without a rebuild
export const revalidate = 300

/**
 * Public, indexable pages only. Category listings are /bouquets?category=…, which is also
 * their canonical URL, so they are listed too; other filters and /favorites are noindex.
 * Sitemaps need absolute URLs: until the real domain is configured it is empty.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteConfig.url) return []
  const url = (path: string) => absoluteUrl(path)!
  const [slugs, categories] = await Promise.all([getProductSlugs(), getCategories()])
  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/bouquets"), changeFrequency: "daily", priority: 0.9 },
    ...categories.map((category) => ({
      url: url(categoryHref(category.slug)),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...slugs.map((slug) => ({
      url: url(`/bouquets/${slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]
}
