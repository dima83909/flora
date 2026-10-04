import type { Metadata } from "next"
import Form from "next/form"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Flower2Icon, PlusIcon, SearchIcon } from "lucide-react"

import { AvailabilityBadge } from "@/components/admin/availability-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatMoney, plural } from "@/lib/admin-format"
import { isProductAvailability, PRODUCT_AVAILABILITIES, PRODUCT_AVAILABILITY_LABELS } from "@/lib/product-schema"
import { cn } from "@/lib/utils"
import { requireAdmin } from "@/server/admin/auth"
import { getAdminCategoryOptions, listAdminProducts } from "@/server/admin/products"
import type { AdminProductSearch, ProductVisibility } from "@/server/catalog/manage"

export const metadata: Metadata = { title: "Товари" }

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

type Filters = Pick<AdminProductSearch, "categoryId" | "availability" | "visibility"> & { query: string; page: number }

function productsHref({ query, categoryId, availability, visibility, page }: Partial<Filters>) {
  const params = new URLSearchParams()
  if (query) params.set("q", query)
  if (categoryId) params.set("category", categoryId)
  if (availability) params.set("availability", availability)
  if (visibility) params.set("visibility", visibility)
  if (page && page > 1) params.set("page", String(page))
  const search = params.toString()
  return search ? `/admin/products?${search}` : "/admin/products"
}

const VISIBILITY_LABELS: Record<ProductVisibility, string> = { active: "На сайті", hidden: "Приховані" }

const isVisibility = (value: unknown): value is ProductVisibility => value === "active" || value === "hidden"

const columns =
  "md:grid md:grid-cols-[3.5rem_minmax(0,1fr)_9rem_7.5rem_9.5rem] md:items-center md:gap-x-4"

const selectClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 text-sm text-ink outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 pointer-coarse:h-11 sm:w-auto"

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin()

  const params = await searchParams
  const rawCategory = first(params.category)
  const rawAvailability = first(params.availability)
  const rawVisibility = first(params.visibility)
  const rawPage = first(params.page) ?? ""
  const filters: Filters = {
    query: (first(params.q) ?? "").trim().slice(0, 100),
    categoryId: rawCategory && /^[a-z0-9]{1,100}$/i.test(rawCategory) ? rawCategory : undefined,
    availability: isProductAvailability(rawAvailability) ? rawAvailability : undefined,
    visibility: isVisibility(rawVisibility) ? rawVisibility : undefined,
    page: /^[1-9]\d{0,5}$/.test(rawPage) ? Number(rawPage) : 1,
  }

  const [categories, { products, total, pageCount }] = await Promise.all([
    getAdminCategoryOptions(),
    listAdminProducts(filters),
  ])
  // A deleted category in an old link would hide every product; show them all instead
  if (filters.categoryId && !categories.some((c) => c.id === filters.categoryId)) {
    redirect(productsHref({ ...filters, categoryId: undefined, page: 1 }))
  }
  // A page past the end (products were filtered out, or the link is old) shows the last one
  if (filters.page > pageCount) redirect(productsHref({ ...filters, page: pageCount }))

  const filtered = Boolean(filters.query || filters.categoryId || filters.availability || filters.visibility)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-sans text-2xl font-medium text-ink">Товари</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <PlusIcon aria-hidden />
            Додати товар
          </Link>
        </Button>
      </div>

      <Form action="/admin/products" role="search" className="mt-5 flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={filters.query}
            maxLength={100}
            placeholder="Назва, склад або адреса товару"
            aria-label="Пошук товарів"
            className="h-10 bg-card pr-3 pl-9 pointer-coarse:h-11"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <select name="category" defaultValue={filters.categoryId ?? ""} aria-label="Категорія" className={selectClass}>
            <option value="">Усі категорії</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.isActive ? "" : " (прихована)"}
              </option>
            ))}
          </select>
          <select name="availability" defaultValue={filters.availability ?? ""} aria-label="Наявність" className={selectClass}>
            <option value="">Будь-яка наявність</option>
            {PRODUCT_AVAILABILITIES.map((value) => (
              <option key={value} value={value}>
                {PRODUCT_AVAILABILITY_LABELS[value]}
              </option>
            ))}
          </select>
          <select name="visibility" defaultValue={filters.visibility ?? ""} aria-label="Показ на сайті" className={selectClass}>
            <option value="">На сайті й приховані</option>
            {(Object.keys(VISIBILITY_LABELS) as ProductVisibility[]).map((value) => (
              <option key={value} value={value}>
                {VISIBILITY_LABELS[value]}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" className="h-10">
            Показати
          </Button>
        </div>
      </Form>

      <p className="mt-4 text-sm text-ink-soft">
        {filtered ? "Знайдено" : "Усього"} {total} {plural(total, ["товар", "товари", "товарів"])}.
        {filtered ? (
          <>
            {" "}
            <Link href="/admin/products" className="text-ink underline underline-offset-4">
              Скинути фільтри
            </Link>
          </>
        ) : null}
      </p>

      {products.length === 0 ? (
        <div className="mt-4 rounded-2xl border bg-card px-6 py-16 text-center">
          <h2 className="font-sans text-lg font-medium text-ink">{filtered ? "Таких товарів немає" : "Товарів ще немає"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            {filtered
              ? "Спробуйте інший запит або приберіть фільтри."
              : "Додайте перший товар, і він з'явиться в каталозі на сайті."}
          </p>
          <Button asChild variant="outline" className="mt-6">
            {filtered ? <Link href="/admin/products">Показати всі товари</Link> : <Link href="/admin/products/new">Додати товар</Link>}
          </Button>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
          <div aria-hidden className={cn("hidden border-b px-5 py-3 text-xs font-medium text-muted-foreground", columns)}>
            <span>Фото</span>
            <span>Товар</span>
            <span>Категорія</span>
            <span className="text-right">Ціна</span>
            <span>Наявність</span>
          </div>
          <ul className="divide-y">
            {products.map((product) => {
              const photo = product.images[0]?.url
              const flags = [
                product.isPopular && "Популярне",
                product.isNew && "Новинка",
                product.isFeatured && "На головній",
              ].filter(Boolean) as string[]
              return (
                <li key={product.id}>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className={cn(
                      "flex gap-4 px-4 py-3.5 text-sm transition-colors hover:bg-linen/50 focus-visible:bg-linen/50 focus-visible:outline-none md:px-5",
                      columns
                    )}
                  >
                    <span
                      className={cn(
                        "relative flex aspect-4/5 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-linen",
                        !product.isActive && "opacity-50"
                      )}
                    >
                      {photo ? (
                        <Image src={photo} alt="" fill sizes="56px" className="object-cover" />
                      ) : (
                        <Flower2Icon aria-hidden className="size-5 text-muted-foreground" />
                      )}
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-1 md:contents">
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className={cn("font-medium", product.isActive ? "text-ink" : "text-ink-soft")}>
                            {product.name}
                          </span>
                          {product.isActive ? null : (
                            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Прихований</span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-[0.8125rem] text-muted-foreground">{product.composition}</span>
                        {flags.length ? (
                          <span className="mt-1.5 flex flex-wrap gap-1">
                            {flags.map((flag) => (
                              <span key={flag} className="rounded-full bg-petal px-2 py-0.5 text-xs text-ink">
                                {flag}
                              </span>
                            ))}
                          </span>
                        ) : null}
                      </span>

                      <span className="truncate text-ink-soft">
                        {product.category.name}
                        {product.category.isActive ? null : <span className="text-muted-foreground"> (прихована)</span>}
                      </span>

                      <span className="tabular-nums md:text-right">
                        <span className="font-medium text-ink">{formatMoney(product.priceMinor, "UAH")}</span>
                        {product.compareAtPriceMinor ? (
                          <span className="ml-2 text-xs text-muted-foreground line-through md:ml-0 md:block">
                            {formatMoney(product.compareAtPriceMinor, "UAH")}
                          </span>
                        ) : null}
                      </span>

                      <AvailabilityBadge availability={product.availability} />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {pageCount > 1 ? (
        <nav aria-label="Сторінки" className="mt-5 flex items-center justify-between gap-3 text-sm">
          {filters.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={productsHref({ ...filters, page: filters.page - 1 })}>Новіші</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-ink-soft tabular-nums">
            Сторінка {filters.page} з {pageCount}
          </span>
          {filters.page < pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={productsHref({ ...filters, page: filters.page + 1 })}>Давніші</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  )
}
