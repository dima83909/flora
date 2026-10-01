"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { isOrderStatus, MANAGER_NOTE_MAX, ORDER_STATUS_LABELS } from "@/lib/order-status"
import { requireAdmin } from "@/server/admin/auth"
import {
  changeAdminOrderStatus,
  deleteAdminOrder,
  getAdminOrdersVersion,
  saveAdminManagerNote,
} from "@/server/admin/orders"

/*
 * Server actions are public HTTP endpoints: anyone can POST to them with any
 * payload. So each one authorises first and treats its input as untrusted.
 */

export type ActionState = { ok: boolean; message: string } | null

const BAD_REQUEST: ActionState = { ok: false, message: "Некоректний запит. Оновіть сторінку й спробуйте ще раз." }

function parseNumber(value: FormDataEntryValue | null) {
  return typeof value === "string" && /^[1-9]\d{0,8}$/.test(value) ? Number(value) : null
}

function refresh(number: number) {
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${number}`)
}

export async function changeOrderStatus(_previous: ActionState, formData: unknown): Promise<ActionState> {
  await requireAdmin()
  if (!(formData instanceof FormData)) return BAD_REQUEST

  const number = parseNumber(formData.get("number"))
  const from = formData.get("from")
  const to = formData.get("to")
  if (number === null || !isOrderStatus(from) || !isOrderStatus(to)) {
    return BAD_REQUEST
  }

  const result = await changeAdminOrderStatus(number, from, to)
  if (result.ok) {
    refresh(number)
    return { ok: true, message: `Статус змінено: ${ORDER_STATUS_LABELS[to]}.` }
  }

  switch (result.reason) {
    case "not_allowed":
      return {
        ok: false,
        message: `Перехід «${ORDER_STATUS_LABELS[from]}» → «${ORDER_STATUS_LABELS[to]}» не дозволений.`,
      }
    case "stale":
      refresh(number)
      return {
        ok: false,
        message: `Статус уже змінили${result.current ? ` на «${ORDER_STATUS_LABELS[result.current]}»` : ""}. Сторінку оновлено.`,
      }
    case "not_found":
      return { ok: false, message: "Замовлення не знайдено." }
  }
}

export async function saveManagerNote(_previous: ActionState, formData: unknown): Promise<ActionState> {
  await requireAdmin()
  if (!(formData instanceof FormData)) return BAD_REQUEST

  const number = parseNumber(formData.get("number"))
  const raw = formData.get("note")
  if (number === null || typeof raw !== "string") {
    return BAD_REQUEST
  }

  const note = raw.replace(/\r\n/g, "\n").trim()
  if (note.length > MANAGER_NOTE_MAX) {
    return { ok: false, message: `Нотатка задовга: до ${MANAGER_NOTE_MAX} символів.` }
  }

  const saved = await saveAdminManagerNote(number, note || null)
  if (!saved) return { ok: false, message: "Замовлення не знайдено." }

  refresh(number)
  return { ok: true, message: note ? "Нотатку збережено." : "Нотатку очищено." }
}

/** Permanently deletes an order and returns to the list */
export async function deleteOrder(_previous: ActionState, formData: unknown): Promise<ActionState> {
  await requireAdmin()
  if (!(formData instanceof FormData)) return BAD_REQUEST

  const number = parseNumber(formData.get("number"))
  const status = formData.get("status")
  if (number === null || !isOrderStatus(status)) return BAD_REQUEST

  const result = await deleteAdminOrder(number, status)
  if (!result.ok) {
    if (result.reason === "not_found") {
      revalidatePath("/admin/orders")
      return { ok: false, message: "Замовлення вже видалено." }
    }
    refresh(number)
    return {
      ok: false,
      message: `Статус замовлення змінили${result.current ? ` на «${ORDER_STATUS_LABELS[result.current]}»` : ""}. Перевірте його й видаліть ще раз, якщо потрібно.`,
    }
  }

  revalidatePath("/admin/orders")
  redirect("/admin/orders")
}

/**
 * Live updates: returns a fingerprint of the order list (or of one order). The page polls
 * it and re-renders only when it changes. It carries no order data.
 */
export async function getOrdersVersion(number?: unknown): Promise<string> {
  await requireAdmin()
  if (number === undefined || number === null) return getAdminOrdersVersion()
  if (typeof number !== "number" || !Number.isSafeInteger(number) || number < 1 || number > 999_999_999) return "invalid"
  return getAdminOrdersVersion(number)
}
