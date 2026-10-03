import "server-only"

import { MAX_QUANTITY } from "@/lib/cart-limits"
import { customerFieldErrors, orderInputSchema, type CustomerField } from "@/lib/order-schema"
import { getDb } from "@/server/db"
import { isOrderRateLimited, purgeOldOrderAttempts, recordPlacedOrder } from "@/server/orders/rate-limit"

export type UnavailableItem = {
  slug: string
  /** Product name when it still exists in the catalogue */
  name?: string
  problem: "missing" | "out_of_stock"
}

export type CreateOrderResult =
  | { ok: true; number: number }
  | { ok: false; reason: "invalid"; message: string; fieldErrors: Partial<Record<CustomerField, string>> }
  | { ok: false; reason: "unavailable"; message: string; items: UnavailableItem[] }
  | { ok: false; reason: "rate_limited"; message: string }
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
export async function createGuestOrder(
  input: unknown,
  { ip = null }: { ip?: string | null } = {}
): Promise<CreateOrderResult> {
  const parsed = orderInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid",
      message: "Перевірте, будь ласка, поля форми.",
      fieldErrors: customerFieldErrors(parsed.error),
    }
  }
  const { customer, items, website } = parsed.data

  // Only a bot fills the hidden field; answer like any failure so it learns nothing
  if (website) {
    return { ok: false, reason: "error", message: "Не вдалося оформити замовлення. Спробуйте ще раз за кілька хвилин." }
  }
  if (await isOrderRateLimited(customer.phone, ip)) {
    return {
      ok: false,
      reason: "rate_limited",
      message: "Забагато замовлень за короткий час. Спробуйте пізніше або напишіть нам у Telegram.",
    }
  }

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
        if (product.availability === "OUT_OF_STOCK") {
          problems.push({ slug, name: product.name, problem: "out_of_stock" })
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

      await recordPlacedOrder(tx, customer.phone, ip)
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

    await purgeOldOrderAttempts().catch(() => undefined)
    return { ok: true, number: order.number }
  } catch (error) {
    if (error instanceof UnavailableItemsError) {
      return {
        ok: false,
        reason: "unavailable",
        message: "Деякі товари в кошику зараз недоступні. Приберіть їх, щоб оформити замовлення.",
        items: error.items,
      }
    }
    console.error("Failed to create guest order", error)
    return {
      ok: false,
      reason: "error",
      message: "Не вдалося оформити замовлення. Спробуйте ще раз за кілька хвилин.",
    }
  }
}
