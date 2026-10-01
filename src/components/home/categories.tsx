import Link from "next/link"

import { SectionHeading } from "@/components/shared/section-heading"
import { ProductImage } from "@/components/shop/product-image"
import { categoryHref } from "@/config/site"
import { getFeaturedCategories } from "@/server/catalog"
import { formatPrice } from "@/lib/utils"

export async function Categories() {
  const categories = await getFeaturedCategories()
  if (!categories.length) return null

  return (
    <section aria-labelledby="categories-title" className="section-y bg-petal/60">
      <div className="container-page">
        <SectionHeading
          id="categories-title"
          title="Для кожного приводу"
        />
      </div>

      {/* Horizontal scroll on mobile, grid from lg */}
      <ul className="container-page mt-12 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto pb-4 [scrollbar-width:none] md:mt-16 md:scroll-px-10 md:gap-6 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
        {categories.map((category) => (
          <li key={category.slug} className="w-[62%] shrink-0 snap-start sm:w-[40%] lg:w-auto">
            <Link href={categoryHref(category.slug)} className="group block rounded-t-full focus-visible:outline-offset-4">
              <div className="arch aspect-3/4 overflow-hidden">
                <ProductImage
                  visual={category.visual}
                  src={category.image}
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 40vw, 62vw"
                  className="transition-transform duration-700 ease-petal group-hover:scale-[1.04]"
                />
              </div>
              <h3 className="mt-5 text-xl font-normal text-ink transition-colors group-hover:text-stem">
                {category.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{category.description}</p>
              <p className="mt-2 text-sm font-medium text-ink">від {formatPrice(category.priceFrom)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
