/**
 * Exercises guest order creation against the database: server-side pricing,
 * validation, availability checks and transactional behaviour.
 * Test orders are deleted afterwards (order numbers from the sequence are used up).
 *
 * Run with: npm run db:check   (needs DATABASE_URL and a seeded database)
 */
import "dotenv/config"

import { createGuestOrder, type CreateOrderResult } from "@/server/orders/create-order"
import { getDb } from "@/server/db"

const db = getDb()
const failures: string[] = []
const created: number[] = []
let stockBefore: number | null | undefined
const check = (ok: boolean, message: string) => {
  if (!ok) failures.push(message)
}
const customer = { name: "Тест Перевірка", phone: "050 123 45 67", city: "Київ" }

async function place(input: unknown): Promise<CreateOrderResult> {
  const result = await createGuestOrder(input)
  if (result.ok) created.push(result.number)
  return result
}

async function main() {
  const prices = new Map(
    (await db.product.findMany({ select: { slug: true, priceMinor: true, stock: true } })).map((p) => [p.slug, p])
  )
  const ordersBefore = await db.order.count()

  // 1. Browser-supplied prices and totals are ignored
  const tampered = await place({
    customer: { ...customer, comment: "  Подзвоніть після 10:00  " },
    items: [
      { slug: "quiet-harbour", quantity: 2, price: 1, unitPriceMinor: 1 },
      { slug: "fig-cedar-candle", quantity: 1, price: 0 },
    ],
    subtotal: 1,
    subtotalMinor: 1,
  })
  check(tampered.ok, `valid order rejected: ${JSON.stringify(tampered)}`)
  if (tampered.ok) {
    const order = await db.order.findUniqueOrThrow({ where: { number: tampered.number }, include: { items: true } })
    const expected = prices.get("quiet-harbour")!.priceMinor * 2 + prices.get("fig-cedar-candle")!.priceMinor
    check(order.subtotalMinor === expected, `subtotal ${order.subtotalMinor} ≠ database total ${expected}`)
    check(order.status === "NEW", `status ${order.status} ≠ NEW`)
    check(order.number >= 1001, `order number ${order.number} should start at 1001`)
    check(order.customerPhone === "+380501234567", `phone not normalised: ${order.customerPhone}`)
    check(order.customerComment === "Подзвоніть після 10:00", `comment not trimmed: ${order.customerComment}`)
    check(order.items.length === 2 && order.items.every((i) => i.totalMinor === i.unitPriceMinor * i.quantity), "item totals wrong")
    check(order.items.every((i) => i.productName && i.productSlug && i.composition), "item snapshot incomplete")

    // 2. The snapshot survives the product being deleted (rolled back afterwards)
    const rollback = new Error("rollback")
    await db
      .$transaction(async (tx) => {
        const item = order.items[0]
        await tx.product.delete({ where: { id: item.productId! } })
        const after = await tx.orderItem.findUniqueOrThrow({ where: { id: item.id } })
        check(after.productId === null && after.productName === item.productName, "snapshot lost after product deletion")
        throw rollback
      })
      .catch((error) => {
        if (error !== rollback) throw error
      })
  }

  // 3. Invalid input is rejected with field errors
  const invalid: [string, unknown][] = [
    ["quantity 0", { customer, items: [{ slug: "quiet-harbour", quantity: 0 }] }],
    ["negative quantity", { customer, items: [{ slug: "quiet-harbour", quantity: -2 }] }],
    ["fractional quantity", { customer, items: [{ slug: "quiet-harbour", quantity: 1.5 }] }],
    ["over the limit", { customer, items: [{ slug: "quiet-harbour", quantity: 21 }] }],
    ["duplicates over the limit", { customer, items: [{ slug: "quiet-harbour", quantity: 15 }, { slug: "quiet-harbour", quantity: 10 }] }],
    ["empty cart", { customer, items: [] }],
    ["bad phone", { customer: { ...customer, phone: "12345" }, items: [{ slug: "quiet-harbour", quantity: 1 }] }],
    ["blank name", { customer: { ...customer, name: "   " }, items: [{ slug: "quiet-harbour", quantity: 1 }] }],
    ["missing city", { customer: { name: "Тест", phone: "0501234567" }, items: [{ slug: "quiet-harbour", quantity: 1 }] }],
    ["long comment", { customer: { ...customer, comment: "x".repeat(1001) }, items: [{ slug: "quiet-harbour", quantity: 1 }] }],
    ["not an object", "DROP TABLE orders"],
  ]
  for (const [label, input] of invalid) {
    const result = await place(input)
    check(!result.ok && result.reason === "invalid", `${label} should be invalid: ${JSON.stringify(result)}`)
  }
  const badPhone = await place(invalid[6][1])
  check(!badPhone.ok && badPhone.reason === "invalid" && Boolean(badPhone.fieldErrors.phone), "bad phone should flag the phone field")

  // 4. Availability is checked on the server, and nothing is written when it fails
  const countBefore = await db.order.count()
  // The catalogue has no tracked stock of its own, so the check sets one and restores it afterwards
  stockBefore = prices.get("berry-sorbet")!.stock
  await db.product.update({ where: { slug: "berry-sorbet" }, data: { stock: 3 } })
  const unavailable = await place({
    customer,
    items: [
      { slug: "quiet-harbour", quantity: 1 },
      { slug: "no-such-product", quantity: 1 },
      { slug: "white-peony", quantity: 1 },
      { slug: "berry-sorbet", quantity: 4 },
    ],
  })
  const problems = !unavailable.ok && unavailable.reason === "unavailable" ? unavailable.items : []
  check(problems.some((p) => p.slug === "no-such-product" && p.problem === "missing"), "missing product not reported")
  check(problems.some((p) => p.slug === "white-peony" && p.problem === "out_of_stock"), "out-of-stock product not reported")
  check(
    problems.some((p) => p.slug === "berry-sorbet" && p.problem === "insufficient_stock" && p.available === 3),
    "insufficient stock not reported"
  )
  check((await db.order.count()) === countBefore, "a rejected order must not be written")

  const preorder = await place({ customer, items: [{ slug: "pink-peony", quantity: 1 }] })
  check(preorder.ok, "preorder items can be ordered")

  console.log(`Checked guest orders: ${invalid.length + 5} scenarios, ${created.length} test orders created.`)
  check((await db.order.count()) === ordersBefore + created.length, "unexpected orders were created")
}

main()
  .catch((error) => {
    failures.push(String(error))
  })
  .finally(async () => {
    if (created.length) await db.order.deleteMany({ where: { number: { in: created } } })
    if (stockBefore !== undefined) await db.product.update({ where: { slug: "berry-sorbet" }, data: { stock: stockBefore } })
    if (failures.length) {
      console.error(`\n${failures.length} problem(s):\n- ${failures.join("\n- ")}`)
      process.exitCode = 1
    } else {
      console.log("Guest orders behave as expected; test orders removed.")
    }
    await db.$disconnect()
  })
