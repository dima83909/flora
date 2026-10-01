"use server"

import { revalidatePath } from "next/cache"

import { isOrderStatus, MANAGER_NOTE_MAX, ORDER_STATUS_LABELS } from "@/lib/order-status"
import { requireAdmin } from "@/server/admin/auth"
import { changeAdminOrderStatus, saveAdminManagerNote } from "@/server/admin/orders"

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
