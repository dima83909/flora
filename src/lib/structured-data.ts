import { siteConfig } from "@/config/site"
import { getCategory } from "@/data/catalog"
import type { Availability, Product } from "@/types/catalog"

export function absoluteUrl(path: string) {
  return new URL(path, siteConfig.url).toString()
}

const schemaAvailability: Record<Availability, string> = {
  in_stock: "https://schema.org/InStock",
  low_stock: "https://schema.org/LimitedAvailability",
  preorder: "https://schema.org/PreOrder",
  out_of_stock: "https://schema.org/OutOfStock",
}

/** Photo URLs for metadata; empty until real photography is added to the catalogue */
export function productImageUrls(product: Pick<Product, "images">) {
  return (product.images ?? []).map(absoluteUrl)
}

export function productJsonLd(product: Product) {
  const url = absoluteUrl(`/bouquets/${product.slug}`)
  const images = productImageUrls(product)

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.slug,
    url,
    category: getCategory(product.category)?.name,
    // Only real photos are published; the SVG illustrations are placeholders
    ...(images.length ? { image: images } : {}),
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      url,
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
