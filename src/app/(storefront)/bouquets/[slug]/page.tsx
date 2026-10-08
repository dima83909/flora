import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { TruckIcon } from "lucide-react"

import { ProductGallery } from "@/components/product/product-gallery"
import { PurchasePanel } from "@/components/product/purchase-panel"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { SectionHeading } from "@/components/shared/section-heading"
import { Price } from "@/components/shop/price"
import { ProductBadges } from "@/components/shop/product-badges"
import { ProductCard } from "@/components/shop/product-card"
import { categoryHref, isGiftCategory } from "@/config/site"
import { availabilityText } from "@/lib/catalog"
import { pageOpenGraph } from "@/lib/metadata"
import { canonicalPath, jsonLdScript, productImageUrls, productJsonLd } from "@/lib/structured-data"
import { cn, formatPrice } from "@/lib/utils"
import { getCategoryBySlug, getProductBySlug, getProductSlugs, getRelatedProducts } from "@/server/catalog"
import type { Availability, Product } from "@/types/catalog"

// Published products are prerendered at build time; products added later render on
// first request, and unknown slugs return notFound() below
export async function generateStaticParams() {
  return (await getProductSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<"/bouquets/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  // Unknown slugs render the 404 page with its own metadata
  if (!product) notFound()

  const title = `${product.name}: ${formatPrice(product.price)}`
  const description = `${product.description} Доставка по Україні.`
  const url = canonicalPath(`/bouquets/${product.slug}`)
  const images = productImageUrls(product)

  return {
    title,
    description,
    alternates: { canonical: url },
    // The product photograph when its absolute URL is known, otherwise the shared brand image
    openGraph: pageOpenGraph({
      url,
      title: product.name,
      description: product.description,
      ...(images.length ? { images: images.map((src) => ({ url: src, alt: product.name })) } : {}),
    }),
  }
}

function deliveryPromise(product: Product) {
  if (product.availability === "preorder") {
    return "Під замовлення, доставка по всій Україні"
  }
  if (product.availability === "out_of_stock") return "Зараз немає в наявності. Додайте в обране, щоб повернутися пізніше"
  return "Доставляємо по всій Україні цілодобово 24/7"
}

const availabilityDot: Record<Availability, string> = {
  in_stock: "bg-stem",
  low_stock: "bg-rose",
  preorder: "bg-sage",
  out_of_stock: "bg-muted-foreground/50",
}

export default async function ProductPage({ params }: PageProps<"/bouquets/[slug]">) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const [category, related] = await Promise.all([
    getCategoryBySlug(product.category),
    getRelatedProducts(product),
  ])
  const care = product.careInstructions.length ? product.careInstructions : null
  const isGift = isGiftCategory(product.category)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(productJsonLd(product, category?.name))}
      />

      <div className="container-page pt-5 pb-16 md:pt-8 md:pb-24">
        <Breadcrumbs
          items={[
            { name: "Головна", href: "/" },
            { name: "Каталог", href: "/bouquets" },
            ...(category ? [{ name: category.name, href: categoryHref(category.slug) }] : []),
            { name: product.name, href: `/bouquets/${product.slug}` },
          ]}
        />

        <div className="mt-5 grid gap-8 md:mt-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="-mx-5 md:mx-0 lg:col-span-7">
            <div className="lg:sticky lg:top-32">
              {/* Client components get only the fields they use, not the description and care texts */}
              <ProductGallery product={{ name: product.name, visual: product.visual, images: product.images }}>
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
              <PurchasePanel
                product={{
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  oldPrice: product.oldPrice,
                  availability: product.availability,
                }}
              />
            </div>

            <ul className="mt-8 space-y-3.5 rounded-2xl bg-linen/70 p-5 text-[0.9375rem] leading-snug text-ink md:p-6">
              <li className="flex gap-3">
                <TruckIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-stem" strokeWidth={1.5} />
                <span>
                  {deliveryPromise(product)}
                  <span className="mt-0.5 block text-sm text-ink-soft">
                    Вартість і час доставки менеджер узгодить з вами в Telegram
                  </span>
                </span>
              </li>
            </ul>

            <div className="mt-8 divide-y border-y">
              {/* Products added in the admin panel may leave the stem list and size empty */}
              {product.stems.length || product.size ? (
                <Details title={isGift ? "Опис" : "Склад"} defaultOpen>
                  {product.stems.length ? (
                    <ul className="space-y-1.5">
                      {product.stems.map((stem, index) => (
                        <li key={index} className="flex gap-2.5">
                          <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-rose" />
                          {stem}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {product.size ? (
                    <p className={cn("text-sm text-muted-foreground", product.stems.length && "mt-4")}>{product.size}</p>
                  ) : null}
                </Details>
              ) : null}
              {care ? (
                <Details title="Догляд">
                  <ul className="space-y-2">
                    {care.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </Details>
              ) : null}
              <Details title="Доставка та оплата">
                <p>
                  Доставляємо по всій Україні цілодобово 24/7. Після оформлення менеджер напише вам у Telegram і
                  узгодить адресу, дату й час, вартість доставки та спосіб оплати. Онлайн-оплати на
                  сайті немає. Детальніше в розділі{" "}
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
