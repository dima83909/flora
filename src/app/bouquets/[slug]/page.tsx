import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CameraIcon, FeatherIcon, TruckIcon } from "lucide-react"

import { ProductGallery } from "@/components/product/product-gallery"
import { PurchasePanel } from "@/components/product/purchase-panel"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { SectionHeading } from "@/components/shared/section-heading"
import { Price } from "@/components/shop/price"
import { ProductBadges } from "@/components/shop/product-badges"
import { ProductCard } from "@/components/shop/product-card"
import { siteConfig } from "@/config/site"
import { careByCategory } from "@/data/care"
import { getCategory, getProductBySlug, getRelatedProducts, products } from "@/data/catalog"
import { deliveryZones } from "@/data/delivery"
import { availabilityText } from "@/lib/catalog"
import { cn, formatPrice } from "@/lib/utils"
import type { Availability, Product } from "@/types/catalog"

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }))
}

// Unknown slugs render the 404 page instead of being generated on demand
export const dynamicParams = false

export async function generateMetadata({ params }: PageProps<"/bouquets/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) return {}

  const title = `${product.name}: ${formatPrice(product.price)}`
  const description = `${product.description} Доставка по Києву, фото букета перед відправкою.`
  const url = `/bouquets/${product.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: product.name,
      description: product.description,
      locale: siteConfig.locale,
      siteName: siteConfig.name,
    },
  }
}

const schemaAvailability: Record<Availability, string> = {
  in_stock: "https://schema.org/InStock",
  low_stock: "https://schema.org/LimitedAvailability",
  preorder: "https://schema.org/PreOrder",
  out_of_stock: "https://schema.org/OutOfStock",
}

function productJsonLd(product: Product) {
  const url = new URL(`/bouquets/${product.slug}`, siteConfig.url).toString()
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.slug,
    category: getCategory(product.category)?.name,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "UAH",
      price: product.price,
      availability: schemaAvailability[product.availability],
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: siteConfig.name },
    },
  }
}

function deliveryPromise(product: Product) {
  if (product.availability === "preorder") {
    return `Привеземо через ${availabilityText(product).replace("Під замовлення, ", "")} після оплати`
  }
  if (product.availability === "out_of_stock") return "Повідомте флористу, і ми напишемо, щойно сорт з’явиться"
  return `Доставимо сьогодні, якщо замовити до ${siteConfig.delivery.sameDayCutoff}`
}

const availabilityDot: Record<Availability, string> = {
  in_stock: "bg-stem",
  low_stock: "bg-rose",
  preorder: "bg-sage",
  out_of_stock: "bg-muted-foreground/50",
}

export default async function ProductPage({ params }: PageProps<"/bouquets/[slug]">) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()

  const category = getCategory(product.category)
  const related = getRelatedProducts(product)
  const care = careByCategory[product.category]
  const isGift = product.category === "gifts"

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)).replace(/</g, "\\u003c") }}
      />

      <div className="container-page pt-5 pb-16 md:pt-8 md:pb-24">
        <Breadcrumbs
          items={[
            { name: "Головна", href: "/" },
            { name: "Каталог", href: "/bouquets" },
            ...(category ? [{ name: category.name, href: `/bouquets?category=${category.slug}` }] : []),
            { name: product.name, href: `/bouquets/${product.slug}` },
          ]}
        />

        <div className="mt-5 grid gap-8 md:mt-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="-mx-5 md:mx-0 lg:col-span-7">
            <div className="lg:sticky lg:top-32">
              <ProductGallery product={product}>
                <ProductBadges product={product} className="pointer-events-none absolute top-4 left-5 md:left-4" />
              </ProductGallery>
            </div>
          </div>

          <div className="lg:col-span-5 lg:pt-2">
            <h1 className="text-title font-light text-ink">{product.name}</h1>
            <Price price={product.price} oldPrice={product.oldPrice} size="lg" className="mt-4" />
            <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
              <span aria-hidden className={cn("size-2 rounded-full", availabilityDot[product.availability])} />
              {availabilityText(product)}
            </p>

            <p className="mt-6 max-w-prose text-base leading-relaxed text-ink-soft md:text-[1.0625rem]">
              {product.description}
            </p>

            <div className="mt-8">
              <PurchasePanel product={product} />
            </div>

            <ul className="mt-8 space-y-3.5 rounded-2xl bg-linen/70 p-5 text-[0.9375rem] leading-snug text-ink md:p-6">
              <li className="flex gap-3">
                <TruckIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-stem" strokeWidth={1.5} />
                <span>
                  {deliveryPromise(product)}
                  <span className="mt-0.5 block text-sm text-ink-soft">
                    По Києву від {formatPrice(deliveryZones[0].price)}, безкоштовно від{" "}
                    {formatPrice(siteConfig.delivery.freeFrom)}
                  </span>
                </span>
              </li>
              {isGift ? null : (
                <li className="flex gap-3">
                  <CameraIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-stem" strokeWidth={1.5} />
                  Надішлемо фото саме вашого букета перед доставкою
                </li>
              )}
              <li className="flex gap-3">
                <FeatherIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-stem" strokeWidth={1.5} />
                Листівка з вашим текстом, написана від руки, безкоштовно
              </li>
            </ul>

            <div className="mt-8 divide-y border-y">
              <Details title={isGift ? "Опис" : "Склад"} defaultOpen>
                <ul className="space-y-1.5">
                  {product.stems.map((stem) => (
                    <li key={stem} className="flex gap-2.5">
                      <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-rose" />
                      {stem}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-muted-foreground">{product.size}</p>
              </Details>
              {care ? (
                <Details title="Догляд">
                  <ul className="space-y-2">
                    {care.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </Details>
              ) : null}
              <Details title="Доставка та оплата">
                <dl className="divide-y divide-border/70">
                  {deliveryZones.map((zone) => (
                    <div key={zone.area} className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt>
                        {zone.area}
                        <span className="block text-sm text-muted-foreground">{zone.time}</span>
                      </dt>
                      <dd className="shrink-0 font-medium text-ink tabular-nums">
                        {zone.priceFrom ? "від " : ""}
                        {formatPrice(zone.price)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3">
                  Оплата карткою, Apple Pay або Google Pay. Детальніше в розділі{" "}
                  <Link href="/#delivery" className="text-ink underline underline-offset-4">
                    доставка
                  </Link>
                  .
                </p>
              </Details>
            </div>
          </div>
        </div>
      </div>

      {related.length ? (
        <section aria-labelledby="related-title" className="border-t border-border/70 bg-petal/40 py-16 md:py-24">
          <div className="container-page">
            <SectionHeading id="related-title" title="Вам також може сподобатися" />
            <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:mt-12 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.slug} className="flex">
                  <ProductCard product={item} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  )
}

function Details({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group py-1" open={defaultOpen}>
      <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <span
          aria-hidden
          className="relative size-3.5 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-current after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-current after:transition-transform group-open:after:scale-y-0"
        />
      </summary>
      <div className="pb-5 text-[0.9375rem] leading-relaxed text-ink-soft">{children}</div>
    </details>
  )
}
