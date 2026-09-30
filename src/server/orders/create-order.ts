import "server-only"

import { MAX_QUANTITY } from "@/lib/cart-limits"
import { customerFieldErrors, orderInputSchema, type CustomerField } from "@/lib/order-schema"
import { toStorefrontAvailability } from "@/server/catalog/availability"
import { getDb } from "@/server/db"

export type UnavailableItem = {
  slug: string
  /** Product name when it still exists in the catalogue */
  name?: string
  problem: "missing" | "out_of_stock" | "insufficient_stock"
  /** Units that can still be ordered, for insufficient stock */
  available?: number
}

export type CreateOrderResult =
  | { ok: true; number: number }
  | { ok: false; reason: "invalid"; message: string; fieldErrors: Partial<Record<CustomerField, string>> }
  | { ok: false; reason: "unavailable"; message: string; items: UnavailableItem[] }
  | { ok: false; reason: "error"; message: string }

class UnavailableItemsError extends Error {
  constructor(readonly items: UnavailableItem[]) {
    super("Some items are unavailable")
  }
}

/**
 * Creates a guest order. The browser sends only product slugs, quantities and
 * contact details; prices, availability and the subtotal come from PostgreSQL,
 * read and written inside a single transaction.
 */
export async function createGuestOrder(input: unknown): Promise<CreateOrderResult> {
  const parsed = orderInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid",
      message: "Перевірте, будь ласка, поля форми.",
      fieldErrors: customerFieldErrors(parsed.error),
    }
  }
  const { customer, items } = parsed.data

  // A slug may appear once per order; merge accidental duplicates
  const quantities = new Map<string, number>()
  for (const item of items) quantities.set(item.slug, (quantities.get(item.slug) ?? 0) + item.quantity)
  if ([...quantities.values()].some((quantity) => quantity > MAX_QUANTITY)) {
    return {
      ok: false,
      reason: "invalid",
      message: `Не більше ${MAX_QUANTITY} шт. одного товару в замовленні.`,
      fieldErrors: {},
    }
  }

  try {
    const order = await getDb().$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { slug: { in: [...quantities.keys()] }, isActive: true, category: { isActive: true } },
        select: {
          id: true,
          slug: true,
          name: true,
          composition: true,
          priceMinor: true,
          availability: true,
          stock: true,
          leadTimeDays: true,
        },
      })
      const bySlug = new Map(products.map((product) => [product.slug, product]))

      const problems: UnavailableItem[] = []
      const lines = [...quantities].flatMap(([slug, quantity]) => {
        const product = bySlug.get(slug)
        if (!product) {
          problems.push({ slug, problem: "missing" })
          return []
        }
        if (toStorefrontAvailability(product) === "out_of_stock") {
          problems.push({ slug, name: product.name, problem: "out_of_stock" })
          return []
        }
        if (product.stock !== null && quantity > product.stock) {
          problems.push({ slug, name: product.name, problem: "insufficient_stock", available: product.stock })
          return []
        }
        return [
          {
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            composition: product.composition,
            quantity,
            unitPriceMinor: product.priceMinor,
            totalMinor: product.priceMinor * quantity,
          },
        ]
      })
      if (problems.length) throw new UnavailableItemsError(problems)

      return tx.order.create({
        data: {
          customerName: customer.name,
          customerPhone: customer.phone,
          customerCity: customer.city,
          customerComment: customer.comment ?? null,
          subtotalMinor: lines.reduce((sum, line) => sum + line.totalMinor, 0),
          currency: "UAH",
          items: { create: lines },
        },
        select: { number: true },
      })
    })

    return { ok: true, number: order.number }
  } catch (error) {
    if (error instanceof UnavailableItemsError) {
      return {
        ok: false,
        reason: "unavailable",
        message: "Деякі товари в кошику зараз недоступні. Приберіть їх або змініть кількість.",
        items: error.items,
      }
    }
    console.error("Failed to create guest order", error)
    return {
      ok: false,
      reason: "error",
      message: "Не вдалося оформити замовлення. Спробуйте ще раз або зателефонуйте нам.",
    }
  }
}
