import "server-only"

import { randomUUID } from "node:crypto"

import { del, put } from "@vercel/blob"
import sharp from "sharp"

import {
  CARD_IMAGE_WIDTH,
  cardImageUrl,
  isProductImageType,
  isStoredInBlob,
  matchesImageSignature,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_TYPES,
  PRODUCT_IMAGES_MAX,
} from "@/lib/product-images"
import { getDb } from "@/server/db"

/*
 * Product photos for the admin panel. Like the rest of catalogue editing, these
 * functions perform no authorisation: application code reaches them only through
 * `@/server/admin/products`.
 *
 * Files live in Vercel Blob; the database keeps their URLs and order. On Vercel the
 * SDK authenticates with the project's OIDC token; locally it uses the same token
 * from `vercel env pull`, or BLOB_READ_WRITE_TOKEN when set.
 */

/** Where photo files go; checks swap it for an in-memory one */
export type ImageStorage = {
  upload(pathname: string, file: Blob, contentType: string): Promise<string>
  remove(urls: string[]): Promise<void>
}

export const blobStorage: ImageStorage = {
  async upload(pathname, file, contentType) {
    const { url } = await put(pathname, file, {
      access: "public",
      contentType,
      // Every upload gets a new random name, so the file can be cached for a year
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    })
    return url
  },
  async remove(urls) {
    if (urls.length) await del(urls)
  },
}

/** Card thumbnail of a photo: smaller, so catalog pages stay light, and always WebP */
export async function makeCardImage(file: Blob) {
  const bytes = Buffer.from(await file.arrayBuffer())
  const data = await sharp(bytes).rotate().resize({ width: CARD_IMAGE_WIDTH, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer()
  return new Blob([new Uint8Array(data)], { type: "image/webp" })
}

/**
 * Deletes files whose database rows are already gone. A failure only leaves an
 * orphaned file behind, so it is logged rather than undoing the user's action.
 */
export async function removeStoredFiles(urls: string[], storage: ImageStorage = blobStorage) {
  // Every stored photo has a card thumbnail next to it (or did, before thumbnails existed)
  const stored = urls.filter(isStoredInBlob).flatMap((url) => [url, cardImageUrl(url)].filter((u): u is string => !!u))
  if (!stored.length) return
  try {
    await storage.remove(stored)
  } catch (error) {
    console.error("Failed to delete product photos from storage", stored, error)
  }
}

export type AddImageResult =
  | { ok: true; id: string; url: string }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "invalid"; message: string }

const invalid = (message: string): AddImageResult => ({ ok: false, reason: "invalid", message })

/** Validates and stores one photo, appending it to the end of the product's gallery */
export async function addProductImage(
  productId: string,
  file: unknown,
  storage: ImageStorage = blobStorage
): Promise<AddImageResult> {
  if (!(file instanceof Blob) || file.size === 0) return invalid("Файл не отримано. Спробуйте ще раз.")
  if (!isProductImageType(file.type)) return invalid("Підходять фото у форматі JPEG, PNG або WebP.")
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) return invalid("Фото завелике навіть після стиснення.")
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (!matchesImageSignature(header, file.type)) return invalid("Файл пошкоджений або це не фото.")

  const db = getDb()
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { slug: true, name: true, images: { select: { sortOrder: true }, orderBy: { sortOrder: "desc" } } },
  })
  if (!product) return { ok: false, reason: "not_found" }
  if (product.images.length >= PRODUCT_IMAGES_MAX) {
    return invalid(`У товару вже ${PRODUCT_IMAGES_MAX} фото. Видаліть зайві, щоб додати нові.`)
  }

  const url = await storage.upload(
    `products/${product.slug}/${randomUUID()}.${PRODUCT_IMAGE_TYPES[file.type]}`,
    file,
    file.type
  )
  // The thumbnail is an optimisation: without it the card falls back to the original photo
  const thumbnail = cardImageUrl(url)
  if (thumbnail) {
    try {
      const card = await makeCardImage(file)
      await storage.upload(new URL(thumbnail).pathname.slice(1), card, "image/webp")
    } catch (error) {
      console.error("Failed to store a card thumbnail", thumbnail, error)
    }
  }
  try {
    const image = await db.productImage.create({
      data: {
        productId,
        url,
        alt: product.name,
        sortOrder: (product.images[0]?.sortOrder ?? -1) + 1,
      },
      select: { id: true, url: true },
    })
    return { ok: true, ...image }
  } catch (error) {
    // The product was deleted meanwhile, or the database failed: do not leave the file behind
    await removeStoredFiles([url], storage)
    throw error
  }
}

/** Removes one photo; returns false when it is already gone */
export async function deleteProductImage(
  productId: string,
  imageId: string,
  storage: ImageStorage = blobStorage
): Promise<boolean> {
  const db = getDb()
  const image = await db.productImage.findFirst({ where: { id: imageId, productId }, select: { url: true } })
  if (!image) return false
  const { count } = await db.productImage.deleteMany({ where: { id: imageId, productId } })
  if (count === 0) return false
  await removeStoredFiles([image.url], storage)
  return true
}

/**
 * Puts the gallery in the given order; the first photo becomes the main one. The list
 * must name exactly the product's current photos, so an order built from a stale page
 * (a photo added or removed meanwhile) is refused rather than half-applied.
 */
export async function reorderProductImages(productId: string, imageIds: string[]): Promise<boolean> {
  const db = getDb()
  return db.$transaction(async (tx) => {
    const current = await tx.productImage.findMany({ where: { productId }, select: { id: true } })
    const known = new Set(current.map((image) => image.id))
    if (imageIds.length !== known.size || new Set(imageIds).size !== known.size || !imageIds.every((id) => known.has(id))) {
      return false
    }
    for (const [sortOrder, id] of imageIds.entries()) {
      await tx.productImage.update({ where: { id }, data: { sortOrder } })
    }
    return true
  })
}
