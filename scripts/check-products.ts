/**
 * Exercises catalogue editing against the database: validation, slugs, the
 * concurrent-edit guard, hiding and deletion, and what the storefront sees after each.
 * Everything it creates is deleted afterwards.
 *
 * Run with: npm run db:check   (needs DATABASE_URL and a seeded database)
 */
import "dotenv/config"

import type { ProductFormInput } from "@/lib/product-schema"
import { getProductBySlug } from "@/server/catalog"
import { addProductImage, deleteProductImage, reorderProductImages, type ImageStorage } from "@/server/catalog/images"
import {
  countFeaturedProducts,
  createProduct,
  deleteProduct,
  getProductById,
  searchProducts,
  updateProduct,
} from "@/server/catalog/manage"
import { getDb } from "@/server/db"
import { createGuestOrder } from "@/server/orders/create-order"

const db = getDb()
const failures: string[] = []
const createdOrders: number[] = []
const check = (ok: boolean, message: string) => {
  if (!ok) failures.push(message)
}

// Every test product's slug starts with this, so cleanup can find them all
/** Photo storage kept in memory, so the check needs no Blob credentials */
const stored = new Set<string>()
const memoryStorage: ImageStorage = {
  async upload(pathname) {
    const url = `https://check.public.blob.vercel-storage.com/${pathname}`
    stored.add(url)
    return url
  },
  async remove(urls) {
    for (const url of urls) stored.delete(url)
  },
}

/** Smallest byte sequences each format starts with */
const webp = () => new Blob([new Uint8Array([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBPVP8 ")])], { type: "image/webp" })
const jpeg = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10])], { type: "image/jpeg" })

const NAME = "Перевірка Редактора Каталогу"
const SLUG = "perevirka-redaktora-katalohu"

async function form(overrides: Partial<ProductFormInput> = {}): Promise<ProductFormInput> {
  const category = await db.category.findUniqueOrThrow({ where: { slug: "roses" }, select: { id: true } })
  return {
    name: NAME,
    categoryId: category.id,
    composition: "Троянди, евкаліпт",
    stems: "Троянда — 9\nЕвкаліпт — 3",
    description: "Тестовий товар перевірки каталогу.",
    careInstructions: "Підрізайте стебла",
    size: "Висота 40 см",
    price: "1 500",
    oldPrice: "2000",
    availability: "LOW_STOCK",
    leadTimeDays: "",
    isNew: true,
    isPopular: true,
    isFeatured: false,
    isActive: true,
    ...overrides,
  }
}

async function main() {
  const productsBefore = await db.product.count()

  // 1. Invalid input and unknown categories write nothing
  const invalid = await createProduct({ ...(await form()), name: " ", price: "abc" })
  check(!invalid.ok && invalid.reason === "invalid" && Boolean(invalid.fieldErrors.name && invalid.fieldErrors.price), "invalid form accepted")
  const noCategory = await createProduct(await form({ categoryId: "no-such-category" }))
  check(!noCategory.ok && Boolean(noCategory.reason === "invalid" && noCategory.fieldErrors.categoryId), "unknown category accepted")
  check((await db.product.count()) === productsBefore, "a rejected product was written")

  // 2. Creation: transliterated slug, money in kopiykas, visible on the storefront with its badges
  const created = await createProduct(await form())
  if (!created.ok) throw new Error(`valid product rejected: ${JSON.stringify(created)}`)
  check(created.slug === SLUG, `slug ${created.slug} ≠ ${SLUG}`)
  const row = await getProductById(created.id)
  check(row?.priceMinor === 150000 && row.compareAtPriceMinor === 200000, "prices not stored in kopiykas")
  check(row?.availability === "LOW_STOCK" && row.leadTimeDays === null, "availability not stored")
  check(JSON.stringify(row?.stems) === JSON.stringify(["Троянда — 9", "Евкаліпт — 3"]), "stems not split into lines")
  const onStorefront = await getProductBySlug(SLUG)
  check(
    onStorefront?.availability === "low_stock" && onStorefront.isNew === true && onStorefront.isPopular === true,
    `storefront sees ${JSON.stringify(onStorefront && { availability: onStorefront.availability, isNew: onStorefront.isNew })}`
  )
  check(onStorefront?.oldPrice === 2000 && onStorefront.price === 1500, "storefront prices wrong")

  // 3. The same name gets the next free slug
  const twin = await createProduct(await form())
  check(twin.ok && twin.slug === `${SLUG}-2`, `second product slug: ${JSON.stringify(twin)}`)

  // 4. Updates: applied only over the version the manager saw; the slug never changes
  const seen = row!.updatedAt
  const renamed = await updateProduct(
    created.id,
    seen,
    await form({ name: "Інша назва", availability: "PREORDER", leadTimeDays: "3", oldPrice: "", isFeatured: true })
  )
  check(renamed.ok && renamed.slug === SLUG, `rename changed the slug or failed: ${JSON.stringify(renamed)}`)
  const afterRename = await getProductById(created.id)
  check(afterRename?.name === "Інша назва" && afterRename.compareAtPriceMinor === null, "update not saved")
  check(afterRename?.availability === "PREORDER" && afterRename.leadTimeDays === 3, "preorder lead time not saved")

  const stale = await updateProduct(created.id, seen, await form({ name: "Застаріла правка" }))
  check(!stale.ok && stale.reason === "stale", `an edit over a stale version was applied: ${JSON.stringify(stale)}`)
  check((await getProductById(created.id))?.name === "Інша назва", "a stale edit overwrote the product")
  const badUpdate = await updateProduct(created.id, afterRename!.updatedAt, await form({ price: "0" }))
  check(!badUpdate.ok && badUpdate.reason === "invalid", "an invalid update was accepted")
  const missing = await updateProduct("no-such-product", new Date(), await form())
  check(!missing.ok && missing.reason === "not_found", "updating a missing product should report not_found")

  // 5. Homepage count can leave the product being edited out
  const featured = await countFeaturedProducts()
  check((await countFeaturedProducts(created.id)) === featured - 1, "featured count does not exclude the edited product")

  // 6. Search and filters in the admin list
  const found = await searchProducts({ query: "інша НАЗВА" })
  check(found.products.some((p) => p.id === created.id), "search by name is not case-insensitive")
  check((await searchProducts({ query: SLUG })).total === 2, "search by slug should find both test products")
  const preorders = await searchProducts({ query: SLUG, availability: "PREORDER" })
  check(preorders.total === 1 && preorders.products[0].id === created.id, "availability filter wrong")

  // 7. Hiding removes it from the storefront but not from the admin list
  const visible = (await getProductById(created.id))!.updatedAt
  const hiddenNow = await updateProduct(created.id, visible, await form({ name: "Інша назва", isActive: false }))
  check(hiddenNow.ok, `hiding failed: ${JSON.stringify(hiddenNow)}`)
  check((await getProductBySlug(SLUG)) === null, "a hidden product is still on the storefront")
  const hidden = await searchProducts({ query: SLUG, visibility: "hidden" })
  check(hidden.total === 1 && hidden.products[0].id === created.id, "hidden filter wrong")
  const visibleCount = (await searchProducts({ query: SLUG, visibility: "active" })).total
  check(visibleCount === 1, `active filter should find only the twin, found ${visibleCount}`)
  const hiddenAt = (await getProductById(created.id))!.updatedAt
  const shown = await updateProduct(created.id, hiddenAt, await form({ name: "Інша назва", isActive: true }))
  check(shown.ok && (await getProductBySlug(SLUG)) !== null, "publishing again failed")

  // 8. Photos: checked uploads, order, removal; seed photos in /public are never sent to storage
  const bad = [
    await addProductImage(created.id, new Blob(["<html>"], { type: "image/jpeg" }), memoryStorage),
    await addProductImage(created.id, new Blob(["text"], { type: "text/plain" }), memoryStorage),
    await addProductImage(created.id, new Blob([], { type: "image/png" }), memoryStorage),
    await addProductImage(created.id, "not a file", memoryStorage),
  ]
  check(bad.every((r) => !r.ok && r.reason === "invalid") && stored.size === 0, `bad photos accepted: ${JSON.stringify(bad)}`)
  const missingProduct = await addProductImage("no-such-product", jpeg(), memoryStorage)
  check(!missingProduct.ok && missingProduct.reason === "not_found" && stored.size === 0, "photo for a missing product accepted")

  const first = await addProductImage(created.id, webp(), memoryStorage)
  const second = await addProductImage(created.id, jpeg(), memoryStorage)
  if (!first.ok || !second.ok) throw new Error(`valid photos rejected: ${JSON.stringify([first, second])}`)
  check(first.url.includes(`/products/${SLUG}/`) && first.url.endsWith(".webp") && second.url.endsWith(".jpg"), "photo paths wrong")
  const local = await db.productImage.create({
    data: { productId: created.id, url: "/images/products/check/main.webp", alt: NAME, sortOrder: 5 },
  })
  check(
    JSON.stringify((await getProductBySlug(SLUG))?.images) === JSON.stringify([first.url, second.url, local.url]),
    "storefront photos are not in upload order"
  )

  check(await reorderProductImages(created.id, [second.id, local.id, first.id]), "reordering failed")
  check(
    JSON.stringify((await getProductBySlug(SLUG))?.images) === JSON.stringify([second.url, local.url, first.url]),
    "storefront photos are not in the new order"
  )
  check(!(await reorderProductImages(created.id, [second.id, first.id])), "an order missing a photo was applied")
  check(!(await reorderProductImages(created.id, [second.id, first.id, first.id])), "an order with a duplicate was applied")

  check(await deleteProductImage(created.id, second.id, memoryStorage), "photo deletion failed")
  check(!stored.has(second.url) && stored.has(first.url), "deleting a photo did not remove exactly its file")
  check(!(await deleteProductImage(created.id, second.id, memoryStorage)), "deleting a photo twice should fail")
  check(!(await deleteProductImage(twin.ok ? twin.id : "", first.id, memoryStorage)), "a photo was deleted through another product")

  // 9. Deletion keeps past orders intact and removes the product's uploaded files
  const order = await createGuestOrder({
    customer: { name: "Тест Каталогу", phone: "+380509990101", city: "Київ" },
    items: [{ slug: SLUG, quantity: 2 }],
  })
  if (!order.ok) throw new Error(`could not order the test product: ${JSON.stringify(order)}`)
  createdOrders.push(order.number)
  const deleted = await deleteProduct(created.id, memoryStorage)
  check(deleted.ok && deleted.slug === SLUG, "deletion failed")
  check(stored.size === 0, `uploaded photos left behind: ${[...stored]}`)
  check((await getProductById(created.id)) === null, "deleted product still exists")
  const item = await db.orderItem.findFirst({ where: { order: { number: order.number } } })
  check(item?.productId === null && item.productSlug === SLUG && item.quantity === 2, "order lost its snapshot of the deleted product")
  check(!(await deleteProduct(created.id, memoryStorage)).ok, "deleting twice should report not_found")

  console.log("Checked catalogue editing: validation, slugs, stale edits, search, hiding, photos and deletion.")
}

main()
  .catch((error) => {
    failures.push(String(error))
  })
  .finally(async () => {
    if (createdOrders.length) await db.order.deleteMany({ where: { number: { in: createdOrders } } })
    await db.orderAttempt.deleteMany({ where: { phone: "+380509990101" } })
    await db.product.deleteMany({ where: { slug: { startsWith: SLUG } } })
    if (failures.length) {
      console.error(`\n${failures.length} problem(s):\n- ${failures.join("\n- ")}`)
      process.exitCode = 1
    } else {
      console.log("Catalogue editing behaves as expected; test products removed.")
    }
    await db.$disconnect()
  })
