import "server-only"

import { Prisma } from "@/generated/prisma/client"
import {
  productFieldErrors,
  productFormSchema,
  type ProductAvailabilityValue,
  type ProductField,
  type ProductFormData,
} from "@/lib/product-schema"
import { slugify } from "@/lib/slug"
import { normalizeSearchQuery } from "@/lib/text"
import { blobStorage, removeStoredFiles, type ImageStorage } from "@/server/catalog/images"
import { getDb } from "@/server/db"

/*
 * Catalogue editing for the admin panel. Like the order queries, these functions
 * perform no authorisation: application code must reach them only through
 * `@/server/admin/products`, which checks the admin session first and refreshes
 * the storefront after a change. Nothing customer-facing may import this module.
 *
 * Form input is validated here with the shared schema, so every caller gets the
 * same rules whatever it passes in.
 */

export type ProductVisibility = "active" | "hidden"

export type AdminProductSearch = {
  query?: string
  categoryId?: string
  availability?: ProductAvailabilityValue
  visibility?: ProductVisibility
  skip?: number
  take?: number
}

function searchWhere({ query, categoryId, availability, visibility }: AdminProductSearch): Prisma.ProductWhereInput {
  const q = normalizeSearchQuery(query)
  return {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q.toLowerCase() } },
            { composition: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(availability ? { availability } : {}),
    ...(visibility ? { isActive: visibility === "active" } : {}),
  }
}

/** Newest first, with what the list shows: category, main photo */
export async function findAdminProducts({ skip = 0, take = 25, ...filters }: AdminProductSearch = {}) {
  const where = searchWhere(filters)
  const db = getDb()
  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip,
      take,
      include: {
        category: { select: { name: true, isActive: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
    }),
    db.product.count({ where }),
  ])
  return { products, total }
}

export function getProductById(id: string) {
  return getDb().product.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true, isActive: true } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  })
}

/** Every category, hidden ones included, for the product form */
export function getCategoryOptions() {
  return getDb().category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, isActive: true },
  })
}

/** Products the homepage can show (published, in a visible category), optionally leaving one out */
export function countFeaturedProducts(exceptId?: string) {
  return getDb().product.count({
    where: {
      isFeatured: true,
      isActive: true,
      category: { isActive: true },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
  })
}

type Invalid = { ok: false; reason: "invalid"; fieldErrors: Partial<Record<ProductField, string>> }

function parseForm(input: unknown): { ok: true; data: ProductFormData } | Invalid {
  const parsed = productFormSchema.safeParse(input)
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, reason: "invalid", fieldErrors: productFieldErrors(parsed.error) }
}

const unknownCategory: Invalid = {
  ok: false,
  reason: "invalid",
  fieldErrors: { categoryId: "Такої категорії вже немає. Оновіть сторінку й оберіть іншу." },
}

async function categoryExists(id: string) {
  return (await getDb().category.findUnique({ where: { id }, select: { id: true } })) !== null
}

function isUniqueViolation(error: unknown, field: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false
  // The driver adapter reports the constraint, not always the field list
  return JSON.stringify(error.meta ?? {}).includes(field)
}

/** The name's slug, or the first free "name-2", "name-3"… */
async function freeSlug(name: string) {
  const base = slugify(name) || "product"
  const taken = new Set(
    (await getDb().product.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } })).map(
      (row) => row.slug
    )
  )
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`
}

export type CreateProductResult = { ok: true; id: string; slug: string } | Invalid

/**
 * Creates a product from the form. The URL slug comes from the name and never
 * changes afterwards: carts, favourites and shared links refer to it.
 */
export async function createProduct(input: unknown): Promise<CreateProductResult> {
  const form = parseForm(input)
  if (!form.ok) return form
  if (!(await categoryExists(form.data.categoryId))) return unknownCategory

  // Another product may take the same slug between the lookup and the insert
  for (let attempt = 0; ; attempt++) {
    const slug = await freeSlug(form.data.name)
    try {
      const product = await getDb().product.create({ data: { ...form.data, slug }, select: { id: true, slug: true } })
      return { ok: true, ...product }
    } catch (error) {
      if (attempt < 2 && isUniqueViolation(error, "slug")) continue
      throw error
    }
  }
}

export type UpdateProductResult =
  | { ok: true; slug: string }
  | Invalid
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "stale"; updatedAt: Date }

/**
 * Saves the form over an existing product. `expectedUpdatedAt` is when the product
 * was last changed as the manager saw it: the update applies only if nobody has
 * saved it since, so one manager cannot silently overwrite another.
 */
export async function updateProduct(id: string, expectedUpdatedAt: Date, input: unknown): Promise<UpdateProductResult> {
  const form = parseForm(input)
  if (!form.ok) return form
  if (!(await categoryExists(form.data.categoryId))) return unknownCategory

  const db = getDb()
  const { count } = await db.product.updateMany({ where: { id, updatedAt: expectedUpdatedAt }, data: form.data })
  const product = await db.product.findUnique({ where: { id }, select: { slug: true, updatedAt: true } })
  if (!product) return { ok: false, reason: "not_found" }
  if (count === 0) return { ok: false, reason: "stale", updatedAt: product.updatedAt }
  return { ok: true, slug: product.slug }
}

export type ProductChangeResult = { ok: true; slug: string } | { ok: false; reason: "not_found" }

/**
 * Permanently deletes a product, its photo records and the uploaded photo files.
 * Past orders keep their snapshot of it; their link to the product becomes empty
 * (ON DELETE SET NULL).
 */
export async function deleteProduct(id: string, storage: ImageStorage = blobStorage): Promise<ProductChangeResult> {
  try {
    const product = await getDb().product.delete({
      where: { id },
      select: { slug: true, images: { select: { url: true } } },
    })
    await removeStoredFiles(
      product.images.map((image) => image.url),
      storage
    )
    return { ok: true, slug: product.slug }
  } catch (error) {
    if (isNotFound(error)) return { ok: false, reason: "not_found" }
    throw error
  }
}

function isNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
}
