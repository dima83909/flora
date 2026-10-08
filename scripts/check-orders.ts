/**
 * Exercises guest order creation against the database: server-side pricing,
 * validation, availability checks and transactional behaviour.
 * Test orders are deleted afterwards (order numbers from the sequence are used up).
 *
 * Run with: npm run db:check   (needs DATABASE_URL and a seeded database)
 */
import "dotenv/config"

import type { ProductAvailability } from "@/generated/prisma/enums"
import { createGuestOrder, type CreateOrderResult } from "@/server/orders/create-order"
import { getDb } from "@/server/db"

const db = getDb()
const failures: string[] = []
const created: number[] = []
let availabilityBefore: ProductAvailability | undefined
const check = (ok: boolean, message: string) => {
  if (!ok) failures.push(message)
}
const customer = { name: "Тест Перевірка", phone: "050 123 45 67", city: "Київ" }

const startedAt = new Date()

async function place(input: unknown, options?: { ip?: string | null }): Promise<CreateOrderResult> {
  const result = await createGuestOrder(input, options)
  if (result.ok) created.push(result.number)
  return result
}

async function main() {
  const prices = new Map(
    (await db.product.findMany({ select: { slug: true, priceMinor: true, availability: true } })).map((p) => [p.slug, p])
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
  const unavailable = await place({
    customer,
    items: [
      { slug: "quiet-harbour", quantity: 1 },
      { slug: "no-such-product", quantity: 1 },
      { slug: "white-peony", quantity: 1 },
    ],
  })
  const problems = !unavailable.ok && unavailable.reason === "unavailable" ? unavailable.items : []
  check(problems.some((p) => p.slug === "no-such-product" && p.problem === "missing"), "missing product not reported")
  check(problems.some((p) => p.slug === "white-peony" && p.problem === "out_of_stock"), "out-of-stock product not reported")
  check(problems.length === 2, `only the missing and sold-out items should be reported: ${JSON.stringify(problems)}`)
  check((await db.order.count()) === countBefore, "a rejected order must not be written")

  // "Running low" is a label only: quantities are not tracked, so any quantity can be ordered.
  // The catalogue has no such product, so the check marks one and restores it afterwards
  availabilityBefore = prices.get("berry-sorbet")!.availability
  await db.product.update({ where: { slug: "berry-sorbet" }, data: { availability: "LOW_STOCK" } })
  const lowStock = await place({ customer, items: [{ slug: "berry-sorbet", quantity: 10 }] })
  check(lowStock.ok, `low-stock items can be ordered in any quantity: ${JSON.stringify(lowStock)}`)

  const preorder = await place({ customer, items: [{ slug: "pink-peony", quantity: 1 }] })
  check(preorder.ok, "preorder items can be ordered")

  // 5. Spam protection: honeypot and rate limits (fixtures are inserted directly to keep this fast)
  const line = [{ slug: "quiet-harbour", quantity: 1 }]
  const ordersBeforeSpam = await db.order.count()
  const bot = await place({ customer, website: "https://spam.example", items: line })
  check(!bot.ok && bot.reason === "error", `filled honeypot should be refused: ${JSON.stringify(bot)}`)
  check((await db.order.count()) === ordersBeforeSpam, "a honeypot order must not be written")

  const hourAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000)
  const spamPhone = "+380509990001"
  await db.orderAttempt.createMany({ data: Array.from({ length: 5 }, () => ({ phone: spamPhone, ip: null })) })
  const byPhone = await place({ customer: { ...customer, phone: spamPhone }, items: line })
  check(!byPhone.ok && byPhone.reason === "rate_limited", `5 recent orders should limit the phone: ${JSON.stringify(byPhone)}`)
  const otherPhone = await place({ customer: { ...customer, phone: "+380509990002" }, items: line })
  check(otherPhone.ok, "the phone limit leaked to another number")

  const spamIp = "203.0.113.50"
  await db.orderAttempt.createMany({ data: Array.from({ length: 10 }, (_, i) => ({ phone: `+38050999${i}000`, ip: spamIp })) })
  const byIp = await place({ customer: { ...customer, phone: "+380509990003" }, items: line }, { ip: spamIp })
  check(!byIp.ok && byIp.reason === "rate_limited", `10 recent orders should limit the address: ${JSON.stringify(byIp)}`)
  const unknownIp = await place({ customer: { ...customer, phone: "+380509990004" }, items: line })
  check(unknownIp.ok, "an unknown address must not be limited by the address counter")

  const stalePhone = "+380509990005"
  await db.orderAttempt.createMany({
    data: Array.from({ length: 5 }, () => ({ phone: stalePhone, ip: null, createdAt: hourAgo(120) })),
  })
  check((await place({ customer: { ...customer, phone: stalePhone }, items: line })).ok, "orders older than an hour must not count")

  const trackedIp = "198.51.100.77"
  const tracked = await place({ customer: { ...customer, phone: "+380509990006" }, items: line }, { ip: trackedIp })
  check(
    tracked.ok && (await db.orderAttempt.count({ where: { ip: trackedIp, phone: "+380509990006" } })) === 1,
    "a placed order should be recorded with its address"
  )

  // A burst of parallel orders from one phone cannot all pass the count before the first is written
  const burstPhone = "+380509990007"
  const burst = await Promise.all(
    Array.from({ length: 8 }, () => place({ customer: { ...customer, phone: burstPhone }, items: line }))
  )
  const burstPlaced = burst.filter((result) => result.ok).length
  check(
    burstPlaced === 5 && burst.every((result) => result.ok || result.reason === "rate_limited"),
    `8 parallel orders from one phone should place exactly 5, placed ${burstPlaced}`
  )
  check((await db.orderAttempt.count({ where: { phone: burstPhone } })) === 5, "a refused parallel order was counted")

  // An order refused for an unavailable item is rolled back together with its count
  const unluckyPhone = "+380509990008"
  await place({ customer: { ...customer, phone: unluckyPhone }, items: [{ slug: "no-such-product", quantity: 1 }] })
  check((await db.orderAttempt.count({ where: { phone: unluckyPhone } })) === 0, "an order with unavailable items was counted")

  console.log(`Checked guest orders: ${invalid.length + 8} scenarios, ${created.length} test orders created.`)
  check((await db.order.count()) === ordersBefore + created.length, "unexpected orders were created")
}

main()
  .catch((error) => {
    failures.push(String(error))
  })
  .finally(async () => {
    await db.orderAttempt.deleteMany({ where: { createdAt: { gte: startedAt } } })
    await db.orderAttempt.deleteMany({ where: { phone: { startsWith: "+38050999" } } })
    if (created.length) await db.order.deleteMany({ where: { number: { in: created } } })
    if (availabilityBefore !== undefined) {
      await db.product.update({ where: { slug: "berry-sorbet" }, data: { availability: availabilityBefore } })
    }
    if (failures.length) {
      console.error(`\n${failures.length} problem(s):\n- ${failures.join("\n- ")}`)
      process.exitCode = 1
    } else {
      console.log("Guest orders behave as expected; test orders removed.")
    }
    await db.$disconnect()
  })
