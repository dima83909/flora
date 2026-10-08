import { z } from "zod"

import { MAX_QUANTITY } from "@/lib/cart-limits"
import { singleLine } from "@/lib/text"

/*
 * Guest order input, shared by the checkout form (instant feedback) and the
 * server action (the authority). Prices are deliberately absent: the server
 * reads them from the database, and unknown keys are stripped by Zod.
 */

export const ORDER_LIMITS = {
  nameMax: 100,
  cityMax: 100,
  commentMax: 1000,
  maxLines: 50,
} as const

/**
 * Normalises a phone number to E.164. Ukrainian numbers may be typed in any
 * common form: +380 50 123 45 67, 380501234567, 0501234567, (050) 123-45-67.
 * Other countries must start with "+". Returns null when the number is invalid.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim()
  const digits = trimmed.replace(/\D/g, "")

  if (/^380\d{9}$/.test(digits)) return `+${digits}`
  if (/^0\d{9}$/.test(digits) && !trimmed.startsWith("+")) return `+38${digits}`
  if (trimmed.startsWith("+") && /^[1-9]\d{7,14}$/.test(digits)) return `+${digits}`
  return null
}

export const customerSchema = z.object({
  name: z
    .string({ error: "Вкажіть ім'я" })
    .transform(singleLine)
    .pipe(
      z
        .string()
        .min(2, "Вкажіть ім'я, щоб менеджер знав, як до вас звертатися")
        .max(ORDER_LIMITS.nameMax, `Ім'я занадто довге (до ${ORDER_LIMITS.nameMax} символів)`)
    ),
  phone: z
    .string({ error: "Вкажіть телефон" })
    .transform((value, ctx) => {
      const phone = normalizePhone(value)
      if (!phone) {
        ctx.addIssue({
          code: "custom",
          message: value.trim()
            ? "Перевірте номер: наприклад, 050 123 45 67 або +380 50 123 45 67"
            : "Вкажіть телефон, щоб менеджер міг зв'язатися з вами в Telegram",
        })
        return z.NEVER
      }
      return phone
    }),
  city: z
    .string({ error: "Вкажіть місто" })
    .transform(singleLine)
    .pipe(
      z
        .string()
        .min(2, "Вкажіть місто доставки")
        .max(ORDER_LIMITS.cityMax, `Назва міста занадто довга (до ${ORDER_LIMITS.cityMax} символів)`)
    ),
  comment: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined)
    .pipe(
      z
        .string()
        .max(ORDER_LIMITS.commentMax, `Коментар до ${ORDER_LIMITS.commentMax} символів`)
        .optional()
    ),
})

export const orderLineSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Некоректний товар"),
  quantity: z
    .number({ error: "Некоректна кількість" })
    .int("Некоректна кількість")
    .min(1, "Кількість має бути не менше 1")
    .max(MAX_QUANTITY, `Не більше ${MAX_QUANTITY} шт. одного товару`),
})

export const orderInputSchema = z.object({
  customer: customerSchema,
  /** Honeypot: hidden from people, so only bots fill it in. Must stay empty. */
  website: z.string().max(500).optional(),
  /** Random per checkout; a retried submission with the same key returns the order already placed */
  idempotencyKey: z.uuid().optional(),
  items: z
    .array(orderLineSchema)
    .min(1, "Кошик порожній")
    .max(ORDER_LIMITS.maxLines, "Забагато позицій в одному замовленні"),
})

/** What the browser sends */
export type OrderInput = z.input<typeof orderInputSchema>
/** After trimming and normalisation */
export type ValidOrderInput = z.output<typeof orderInputSchema>
export type CustomerField = keyof z.input<typeof customerSchema>

/** First message per customer field, for showing next to inputs */
export function customerFieldErrors(error: z.ZodError): Partial<Record<CustomerField, string>> {
  const result: Partial<Record<CustomerField, string>> = {}
  const fields = Object.keys(customerSchema.shape) as CustomerField[]
  for (const issue of error.issues) {
    const [scope, field] = issue.path
    const key = (scope === "customer" ? field : scope) as CustomerField
    if (fields.includes(key) && !result[key]) result[key] = issue.message
  }
  return result
}
