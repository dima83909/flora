import "server-only"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/server/admin/auth"
import { addProductImage, deleteProductImage, reorderProductImages } from "@/server/catalog/images"
import {
  countFeaturedProducts,
  createProduct,
  deleteProduct,
  getCategoryOptions,
  getProductById,
  searchProducts,
  updateProduct,
  type AdminProductSearch,
} from "@/server/catalog/manage"

/*
 * Catalogue data for the admin panel. Every function checks the admin session before
 * touching the database, so a page or action that forgets its own check still cannot
 * read or change products. Writes are called from server actions only.
 */

export const PRODUCTS_PAGE_SIZE = 25

/**
 * Every storefront page carries catalogue data (the layout feeds the cart, search
 * and menu), so a change refreshes them all, the sitemap included. Catalogue edits
 * are rare enough for that to be cheap.
 */
function refreshStorefront() {
  revalidatePath("/", "layout")
  revalidatePath("/sitemap.xml")
}

export async function listAdminProducts(filters: Omit<AdminProductSearch, "skip" | "take"> & { page: number }) {
  await requireAdmin()
  const { page, ...search } = filters
  const { products, total } = await searchProducts({
    ...search,
    skip: (page - 1) * PRODUCTS_PAGE_SIZE,
    take: PRODUCTS_PAGE_SIZE,
  })
  return { products, total, pageCount: Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE)) }
}

export async function getAdminProduct(id: string) {
  await requireAdmin()
  return getProductById(id)
}

export async function getAdminCategoryOptions() {
  await requireAdmin()
  return getCategoryOptions()
}

export async function countAdminFeaturedProducts(exceptId?: string) {
  await requireAdmin()
  return countFeaturedProducts(exceptId)
}

export async function createAdminProduct(input: unknown) {
  await requireAdmin()
  const result = await createProduct(input)
  if (result.ok) refreshStorefront()
  return result
}

export async function updateAdminProduct(id: string, expectedUpdatedAt: Date, input: unknown) {
  await requireAdmin()
  const result = await updateProduct(id, expectedUpdatedAt, input)
  if (result.ok) refreshStorefront()
  return result
}

export async function deleteAdminProduct(id: string) {
  await requireAdmin()
  const result = await deleteProduct(id)
  if (result.ok) refreshStorefront()
  return result
}

export async function addAdminProductImage(productId: string, file: unknown) {
  await requireAdmin()
  const result = await addProductImage(productId, file)
  if (result.ok) refreshStorefront()
  return result
}

export async function deleteAdminProductImage(productId: string, imageId: string) {
  await requireAdmin()
  const deleted = await deleteProductImage(productId, imageId)
  refreshStorefront()
  return deleted
}

export async function reorderAdminProductImages(productId: string, imageIds: string[]) {
  await requireAdmin()
  const reordered = await reorderProductImages(productId, imageIds)
  refreshStorefront()
  return reordered
}
