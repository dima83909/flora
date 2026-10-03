import { z } from "zod"

import { toMinor } from "@/lib/money"

/*
 * The admin product form, shared by the browser (instant feedback) and the server
 * (the authority). Input is what the form sends: text fields as strings, check boxes
 * as booleans. Output is ready for the database: money in kopiykas, lists as arrays,
 * empty optional fields as null.
 */

export const PRODUCT_AVAILABILITIES = ["IN_STOCK", "LOW_STOCK", "PREORDER", "OUT_OF_STOCK"] as const

export type ProductAvailabilityValue = (typeof PRODUCT_AVAILABILITIES)[number]

export const PRODUCT_AVAILABILITY_LABELS: Record<ProductAvailabilityValue, string> = {
  IN_STOCK: "В наявності",
  LOW_STOCK: "Закінчується",
  PREORDER: "Під замовлення",
  OUT_OF_STOCK: "Немає в наявності",
}

export function isProductAvailability(value: unknown): value is ProductAvailabilityValue {
  return typeof value === "string" && (PRODUCT_AVAILABILITIES as readonly string[]).includes(value)
}

export const PRODUCT_LIMITS = {
  nameMax: 120,
  compositionMax: 200,
  descriptionMax: 3000,
  sizeMax: 120,
  listItems: 30,
  listItemMax: 200,
  /** In hryvnias */
  priceMax: 1_000_000,
  leadTimeDaysMax: 60,
} as const

/** The homepage block shows this many products flagged "На головній" */
export const HOMEPAGE_FEATURED_LIMIT = 4

const singleLine = (value: string) => value.trim().replace(/\s+/g, " ")

const text = (label: string, max: number) =>
  z
    .string({ error: `Вкажіть ${label}` })
    .transform(singleLine)
    .pipe(z.string().min(1, `Вкажіть ${label}`).max(max, `До ${max} символів`))

const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((value) => (value ? singleLine(value) : "") || null)
    .pipe(z.string().max(max, `До ${max} символів`).nullable())

/** One item per line; blank lines are skipped */
const lines = (max = PRODUCT_LIMITS.listItems) =>
  z
    .string()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(/\r?\n/)
        .map(singleLine)
        .filter(Boolean)
    )
    .pipe(
      z
        .array(z.string().max(PRODUCT_LIMITS.listItemMax, `Рядок до ${PRODUCT_LIMITS.listItemMax} символів`))
        .max(max, `Не більше ${max} рядків`)
    )

/**
 * Hryvnias as typed: "1850", "1 850", "1850,50" or "1850.5". Returns kopiykas,
 * or null when the text is not an amount.
 */
export function parsePrice(value: string): number | null {
  const normalized = value.replace(/[\s ₴]|грн\.?/gi, "").replace(",", ".")
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(normalized)) return null
  return toMinor(Number(normalized))
}

/** Kopiykas; an empty field is null when the amount is optional, an error otherwise */
function money(value: string | undefined, ctx: z.RefinementCtx, empty: string | null): number | null {
  if (!value?.trim()) {
    if (empty !== null) ctx.addIssue({ code: "custom", message: empty })
    return null
  }
  const minor = parsePrice(value)
  if (minor === null) {
    ctx.addIssue({ code: "custom", message: "Вкажіть суму в гривнях, наприклад 1850 або 1850,50" })
  } else if (minor <= 0) {
    ctx.addIssue({ code: "custom", message: "Сума має бути більшою за нуль" })
  } else if (minor > toMinor(PRODUCT_LIMITS.priceMax)) {
    ctx.addIssue({ code: "custom", message: "Завелика сума" })
  }
  return minor
}

export const productFormSchema = z
  .object({
    name: text("назву", PRODUCT_LIMITS.nameMax),
    categoryId: z.string({ error: "Оберіть категорію" }).trim().min(1, "Оберіть категорію").max(100),
    composition: text("короткий склад", PRODUCT_LIMITS.compositionMax),
    stems: lines(),
    description: z
      .string({ error: "Додайте опис" })
      .transform((value) => value.replace(/\r\n/g, "\n").trim())
      .pipe(
        z
          .string()
          .min(1, "Додайте опис")
          .max(PRODUCT_LIMITS.descriptionMax, `До ${PRODUCT_LIMITS.descriptionMax} символів`)
      ),
    careInstructions: lines(),
    size: optionalText(PRODUCT_LIMITS.sizeMax),
    price: z.string({ error: "Вкажіть ціну" }).transform((value, ctx) => money(value, ctx, "Вкажіть ціну")!),
    /** Empty means no discount */
    oldPrice: z
      .string()
      .optional()
      .transform((value, ctx) => money(value, ctx, null)),
    availability: z.enum(PRODUCT_AVAILABILITIES, { error: "Оберіть наявність" }),
    /** Only for preorder; ignored otherwise */
    leadTimeDays: z.string().optional(),
    isNew: z.boolean().default(false),
    isPopular: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  .transform((input, ctx) => {
    if (input.oldPrice !== null && input.oldPrice <= input.price) {
      ctx.addIssue({ code: "custom", path: ["oldPrice"], message: "Стара ціна має бути більшою за ціну" })
    }

    let leadTimeDays: number | null = null
    if (input.availability === "PREORDER") {
      const raw = input.leadTimeDays?.trim() ?? ""
      leadTimeDays = /^\d{1,3}$/.test(raw) ? Number(raw) : null
      if (leadTimeDays === null || leadTimeDays < 1 || leadTimeDays > PRODUCT_LIMITS.leadTimeDaysMax) {
        ctx.addIssue({
          code: "custom",
          path: ["leadTimeDays"],
          message: `Для товару під замовлення вкажіть строк від 1 до ${PRODUCT_LIMITS.leadTimeDaysMax} днів`,
        })
      }
    }

    const { price, oldPrice, ...rest } = input
    return { ...rest, priceMinor: price, compareAtPriceMinor: oldPrice, leadTimeDays }
  })

/** What the form sends */
export type ProductFormInput = z.input<typeof productFormSchema>
/** Validated, ready for the database */
export type ProductFormData = z.output<typeof productFormSchema>
export type ProductField = keyof ProductFormInput

const productFields = new Set<string>(Object.keys(productFormSchema.in.shape))

/** First message per form field, for showing next to inputs */
export function productFieldErrors(error: z.ZodError): Partial<Record<ProductField, string>> {
  const result: Partial<Record<ProductField, string>> = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === "string" && productFields.has(field) && !result[field as ProductField]) {
      result[field as ProductField] = issue.message
    }
  }
  return result
}

/** Discount shown next to the price fields; null when there is none */
export function formDiscountPercent(price: string, oldPrice: string) {
  const current = parsePrice(price)
  const before = parsePrice(oldPrice)
  if (!current || !before || before <= current) return null
  return Math.round((1 - current / before) * 100)
}
