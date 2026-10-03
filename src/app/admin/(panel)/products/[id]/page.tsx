import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react"

import { DeleteProduct } from "@/components/admin/delete-product"
import { ProductForm } from "@/components/admin/product-form"
import { ProductImages } from "@/components/admin/product-images"
import { formatFullDate } from "@/lib/admin-format"
import { toFormValues } from "@/lib/product-schema"
import { requireAdmin } from "@/server/admin/auth"
import { countAdminFeaturedProducts, getAdminCategoryOptions, getAdminProduct } from "@/server/admin/products"

const parseId = (raw: string) => (/^[a-z0-9]{1,100}$/i.test(raw) ? raw : null)

export async function generateMetadata({ params }: PageProps<"/admin/products/[id]">): Promise<Metadata> {
  const id = parseId((await params).id)
  const product = id ? await getAdminProduct(id) : null
  return { title: product?.name ?? "Товар" }
}

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireAdmin()

  const id = parseId((await params).id)
  const product = id ? await getAdminProduct(id) : null
  if (!product) notFound()

  const [categories, featured, { created }] = await Promise.all([
    getAdminCategoryOptions(),
    countAdminFeaturedProducts(product.id),
    searchParams,
  ])
  const onSite = product.isActive && product.category.isActive

  return (
    <>
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeftIcon aria-hidden className="size-4" />
        Усі товари
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="min-w-0 font-sans text-2xl font-medium break-words text-ink">{product.name}</h1>
        {onSite ? (
          <a
            href={`/bouquets/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            Відкрити на сайті
            <ExternalLinkIcon aria-hidden className="size-3.5" />
          </a>
        ) : (
          <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">Не показується на сайті</span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Адреса: /bouquets/{product.slug} · Додано {formatFullDate(product.createdAt)} · Змінено{" "}
        {formatFullDate(product.updatedAt)}
      </p>

      {created ? (
        <p role="status" className="mt-4 rounded-xl bg-sage/50 px-4 py-3 text-sm text-moss">
          Товар створено{onSite ? " і він уже в каталозі на сайті" : ""}. Тепер можна додати фото.
        </p>
      ) : null}

      <div className="mt-6">
        <ProductForm
          product={{ id: product.id, updatedAt: product.updatedAt.toISOString() }}
          initialValues={toFormValues(product)}
          categories={categories}
          featuredElsewhere={featured}
          media={
            <ProductImages productId={product.id} images={product.images.map(({ id, url }) => ({ id, url }))} />
          }
          aside={
            <section className="rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="font-sans text-base font-medium text-ink">Видалення</h2>
              <p className="mt-1 mb-4 text-sm text-ink-soft">
                Щоб лише тимчасово прибрати товар із сайту, зніміть «Показувати на сайті». Видалення прибирає його
                назавжди.
              </p>
              <DeleteProduct id={product.id} name={product.name} />
            </section>
          }
        />
      </div>
    </>
  )
}
