import type { MetadataRoute } from "next"

import { absoluteUrl } from "@/lib/structured-data"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    // Listed only once the real domain is configured
    ...(absoluteUrl("/sitemap.xml") ? { sitemap: absoluteUrl("/sitemap.xml") } : {}),
  }
}
