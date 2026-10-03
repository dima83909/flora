import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { ProductForm } from "@/components/admin/product-form"
import { EMPTY_PRODUCT_FORM } from "@/lib/product-schema"
import { requireAdmin } from "@/server/admin/auth"
import { countAdminFeaturedProducts, getAdminCategoryOptions } from "@/server/admin/products"

export const metadata: Metadata = { title: "Новий товар" }

export default async function NewProductPage() {
  await requireAdmin()
  const [categories, featured] = await Promise.all([getAdminCategoryOptions(), countAdminFeaturedProducts()])

  return (
    <>
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeftIcon aria-hidden className="size-4" />
        Усі товари
      </Link>
      <h1 className="mt-3 font-sans text-2xl font-medium text-ink">Новий товар</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Адреса сторінки на сайті складеться з назви латиницею і після створення не змінюватиметься.
      </p>
      <div className="mt-6">
        <ProductForm initialValues={EMPTY_PRODUCT_FORM} categories={categories} featuredElsewhere={featured} />
      </div>
    </>
  )
}
