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
import {
  countFeaturedProducts,
  createProduct,
  deleteProduct,
  getProductById,
  searchProducts,
  setProductActive,
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
  check((await setProductActive(created.id, false)).ok, "hiding failed")
  check((await getProductBySlug(SLUG)) === null, "a hidden product is still on the storefront")
  const hidden = await searchProducts({ query: SLUG, visibility: "hidden" })
  check(hidden.total === 1 && hidden.products[0].id === created.id, "hidden filter wrong")
  check((await setProductActive(created.id, true)).ok && (await getProductBySlug(SLUG)) !== null, "publishing failed")
  check(!(await setProductActive("no-such-product", true)).ok, "hiding a missing product should fail")

  // 8. Deletion keeps past orders intact
  const order = await createGuestOrder({
    customer: { name: "Тест Каталогу", phone: "+380509990101", city: "Київ" },
    items: [{ slug: SLUG, quantity: 2 }],
  })
  if (!order.ok) throw new Error(`could not order the test product: ${JSON.stringify(order)}`)
  createdOrders.push(order.number)
  const deleted = await deleteProduct(created.id)
  check(deleted.ok && deleted.slug === SLUG, "deletion failed")
  check((await getProductById(created.id)) === null, "deleted product still exists")
  const item = await db.orderItem.findFirst({ where: { order: { number: order.number } } })
  check(item?.productId === null && item.productSlug === SLUG && item.quantity === 2, "order lost its snapshot of the deleted product")
  check(!(await deleteProduct(created.id)).ok, "deleting twice should report not_found")

  console.log("Checked catalogue editing: validation, slugs, stale edits, search, hiding and deletion.")
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
