import { siteConfig } from "@/config/site"
import type { Availability, Product } from "@/types/catalog"

/** Absolute URL on the storefront's domain, or undefined until the domain is configured */
export function absoluteUrl(path: string): string | undefined {
  return siteConfig.url ? new URL(path, siteConfig.url).toString() : undefined
}

/**
 * Path for canonical links and og:url. Returns undefined until the real domain is
 * configured, so Next.js emits no canonical rather than one on a wrong host.
 */
export function canonicalPath(path: string): string | undefined {
  return siteConfig.url ? path : undefined
}

const schemaAvailability: Record<Availability, string> = {
  in_stock: "https://schema.org/InStock",
  low_stock: "https://schema.org/LimitedAvailability",
  preorder: "https://schema.org/PreOrder",
  out_of_stock: "https://schema.org/OutOfStock",
}

/** Absolute photo URLs for metadata; empty until real photos and the real domain exist */
export function productImageUrls(product: Pick<Product, "images">) {
  return (product.images ?? []).flatMap((path) => {
    const url = absoluteUrl(path)
    return url ? [url] : []
  })
}

export function productJsonLd(product: Product, categoryName?: string) {
  const url = absoluteUrl(`/bouquets/${product.slug}`)
  const images = productImageUrls(product)

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.slug,
    ...(url ? { url } : {}),
    ...(categoryName ? { category: categoryName } : {}),
    // Only real photos are published; the SVG illustrations are placeholders
    ...(images.length ? { image: images } : {}),
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      ...(url ? { url } : {}),
      priceCurrency: "UAH",
      price: product.price.toFixed(2),
      availability: schemaAvailability[product.availability],
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: siteConfig.name },
    },
  }
}

/** Serialises JSON-LD safely for inline <script> tags */
export function jsonLdScript(data: object) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") }
}
