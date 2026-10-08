"use server"

import { redirect } from "next/navigation"

import { isRecordId } from "@/lib/ids"
import type { ProductField } from "@/lib/product-schema"
import { requireAdmin } from "@/server/admin/auth"
import {
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminProductImage,
  reorderAdminProductImages,
  updateAdminProduct,
} from "@/server/admin/products"

/*
 * Server actions are public HTTP endpoints: anyone can POST to them with any
 * payload. So each one authorises first and treats its input as untrusted; the
 * product form itself is validated again by the catalogue service.
 */

export type ProductFormState = {
  ok: boolean
  message: string
  fieldErrors?: Partial<Record<ProductField, string>>
  /** Someone saved the product after this form was opened */
  stale?: boolean
} | null

const BAD_REQUEST = { ok: false, message: "Некоректний запит. Оновіть сторінку й спробуйте ще раз." }

function parseDate(value: unknown) {
  if (typeof value !== "string") return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

type SavePayload = { id?: unknown; updatedAt?: unknown; values?: unknown }

/** Creates a product (no id) or saves the form over an existing one */
export async function saveProduct(_previous: ProductFormState, payload: unknown): Promise<ProductFormState> {
  await requireAdmin()
  if (!payload || typeof payload !== "object") return BAD_REQUEST
  const { id, updatedAt, values } = payload as SavePayload

  if (id === undefined) {
    const result = await createAdminProduct(values)
    if (!result.ok) return { ok: false, message: "Перевірте поля форми.", fieldErrors: result.fieldErrors }
    redirect(`/admin/products/${result.id}?created=1`)
  }

  const seen = parseDate(updatedAt)
  if (!isRecordId(id) || !seen) return BAD_REQUEST

  const result = await updateAdminProduct(id, seen, values)
  if (result.ok) return { ok: true, message: "Зміни збережено, вони вже на сайті." }
  switch (result.reason) {
    case "invalid":
      return { ok: false, message: "Перевірте поля форми.", fieldErrors: result.fieldErrors }
    case "stale":
      return {
        ok: false,
        stale: true,
        message: "Товар уже змінили в іншій вкладці або це зробив інший менеджер. Ваші правки не збережено.",
      }
    case "not_found":
      return { ok: false, message: "Товар уже видалено." }
  }
}

/** Permanently deletes a product and returns to the list */
export async function deleteProduct(_previous: ProductFormState, formData: unknown): Promise<ProductFormState> {
  await requireAdmin()
  if (!(formData instanceof FormData)) return BAD_REQUEST

  const id = formData.get("id")
  if (!isRecordId(id)) return BAD_REQUEST

  const result = await deleteAdminProduct(id)
  if (!result.ok) return { ok: false, message: "Товар уже видалено." }
  redirect("/admin/products")
}

export type ImageActionResult = { ok: boolean; message?: string }

const STALE_PHOTOS = "Фото товару щойно змінилися. Сторінку оновлено, спробуйте ще раз."

export async function removeProductImage(productId: unknown, imageId: unknown): Promise<ImageActionResult> {
  await requireAdmin()
  if (!isRecordId(productId) || !isRecordId(imageId)) return BAD_REQUEST
  const deleted = await deleteAdminProductImage(productId, imageId)
  return deleted ? { ok: true } : { ok: false, message: STALE_PHOTOS }
}

/** Saves the gallery order; the first photo is the one on product cards */
export async function reorderProductImages(productId: unknown, imageIds: unknown): Promise<ImageActionResult> {
  await requireAdmin()
  if (!isRecordId(productId) || !Array.isArray(imageIds) || imageIds.length > 100 || !imageIds.every(isRecordId)) return BAD_REQUEST
  const reordered = await reorderAdminProductImages(productId, imageIds)
  return reordered ? { ok: true } : { ok: false, message: STALE_PHOTOS }
}
