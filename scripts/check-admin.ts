/**
 * Exercises the admin building blocks against the database: password hashing,
 * the order status workflow, manager notes, order search and sign-in throttling.
 * Everything it creates is deleted afterwards.
 *
 * Run with: npm run db:check   (needs DATABASE_URL and a seeded database)
 */
import "dotenv/config"

import { ORDER_STATUSES, ORDER_STATUS_TRANSITIONS, type OrderStatusValue } from "@/lib/order-status"
import { checkLoginAllowed, clearLoginFailures, recordLoginFailure } from "@/server/admin/login-throttle"
import { hashPassword, verifyPassword } from "@/server/admin/password"
import { getDb } from "@/server/db"
import { cleanupExpired, purgeOrders } from "@/server/maintenance"
import { createGuestOrder } from "@/server/orders/create-order"
import {
  deleteOrder,
  getOrderByNumber,
  getOrdersVersion,
  getOrderVersion,
  searchOrders,
  setManagerNote,
  transitionOrderStatus,
} from "@/server/orders/queries"

const db = getDb()
const failures: string[] = []
const created: number[] = []
const startedAt = new Date()
const check = (ok: boolean, message: string) => {
  if (!ok) failures.push(message)
}

async function placeOrder(name: string, phone: string, city: string) {
  const result = await createGuestOrder({ customer: { name, phone, city }, items: [{ slug: "quiet-harbour", quantity: 1 }] })
  if (!result.ok) throw new Error(`could not create a test order: ${JSON.stringify(result)}`)
  created.push(result.number)
  return result.number
}

async function main() {
  // 1. Passwords: hashes are salted and verify only the right password
  const hash = await hashPassword("correct horse battery")
  check(!hash.includes("correct horse"), "hash contains the password")
  check(hash !== (await hashPassword("correct horse battery")), "hashes are not salted")
  check(await verifyPassword("correct horse battery", hash), "right password rejected")
  check(!(await verifyPassword("correct horse batterx", hash)), "wrong password accepted")
  check(!(await verifyPassword("anything", "not-a-hash")), "malformed hash accepted")

  // 2. Status workflow: every pair of statuses, allowed only as the table says
  const number = await placeOrder("Перевірка Статусів", "067 765 43 21", "Чернівці")
  for (const from of ORDER_STATUSES) {
    for (const to of ORDER_STATUSES) {
      await db.order.update({ where: { number }, data: { status: from } })
      const result = await transitionOrderStatus(number, from, to)
      const after = (await db.order.findUniqueOrThrow({ where: { number } })).status
      const allowed = ORDER_STATUS_TRANSITIONS[from].includes(to)
      check(result.ok === allowed, `${from} → ${to}: expected ${allowed ? "allowed" : "rejected"}`)
      check(after === (allowed ? to : from), `${from} → ${to}: order ended up ${after}`)
    }
  }
  const expected: Record<OrderStatusValue, string> = {
    NEW: "CONTACTED,CANCELLED",
    CONTACTED: "CONFIRMED,CANCELLED",
    CONFIRMED: "COMPLETED,CANCELLED",
    COMPLETED: "",
    CANCELLED: "",
  }
  for (const status of ORDER_STATUSES) {
    check(ORDER_STATUS_TRANSITIONS[status].join(",") === expected[status], `transition table changed for ${status}`)
  }

  // A stale page (order already moved on) cannot apply its transition
  await db.order.update({ where: { number }, data: { status: "CONTACTED" } })
  const stale = await transitionOrderStatus(number, "NEW", "CANCELLED")
  check(!stale.ok && stale.reason === "stale" && stale.current === "CONTACTED", `stale transition: ${JSON.stringify(stale)}`)
  const missing = await transitionOrderStatus(999_999_999, "NEW", "CONTACTED")
  check(!missing.ok && missing.reason === "not_found", "transition on a missing order")

  // 3. Manager note
  check(await setManagerNote(number, "Доставка на п'ятницю"), "note not saved")
  check((await getOrderByNumber(number))?.managerNote === "Доставка на п'ятницю", "note not stored")
  check(await setManagerNote(number, null), "note not cleared")
  check((await getOrderByNumber(number))?.managerNote === null, "note not null after clearing")
  check(!(await setManagerNote(999_999_999, "x")), "note saved on a missing order")
  await db.order
    .update({ where: { number }, data: { managerNote: "x".repeat(2001) } })
    .then(() => check(false, "database accepted a 2001-character note"))
    .catch(() => undefined)

  // 4. Search runs in the database: number, name, phone and city
  const other = await placeOrder("Інша Людина", "+380 93 111 22 33", "Ужгород")
  const found = async (query: string, status?: OrderStatusValue) =>
    (await searchOrders({ query, status, take: 100 })).orders.map((order) => order.number)
  check((await found(String(number))).includes(number), "search by number")
  check((await found(`№ ${number}`)).includes(number), "search by № number")
  check((await found("перевірка стат")).includes(number), "search by name, case-insensitive")
  check((await found("ЧЕРНІВЦІ")).includes(number), "search by city, case-insensitive")
  check((await found("067 765 43 21")).includes(number), "search by local phone")
  check((await found("+380677654321")).includes(number), "search by international phone")
  check(!(await found("перевірка стат")).includes(other), "search returned an unrelated order")
  check((await found("ужгород", "NEW")).includes(other), "search combined with a status filter")
  check(!(await found("ужгород", "COMPLETED")).includes(other), "status filter ignored")
  check((await found("100%_такого'; DROP TABLE orders;--")).length === 0, "search with special characters")
  const page = await searchOrders({ take: 1 })
  check(page.orders.length === 1 && page.total >= 2, "pagination")
  check(page.orders[0].number === other, "newest order is not first")

  // 5. Live-update fingerprints change on create, change and delete, and only then
  const listBefore = await getOrdersVersion()
  check(listBefore === (await getOrdersVersion()), "list fingerprint changed without any change")
  const doomed = await placeOrder("Видалити Мене", "050 000 11 22", "Полтава")
  const listAfterCreate = await getOrdersVersion()
  check(listAfterCreate !== listBefore, "list fingerprint did not change after a new order")
  const orderBefore = await getOrderVersion(doomed)
  await new Promise((resolve) => setTimeout(resolve, 5))
  await transitionOrderStatus(doomed, "NEW", "CONTACTED")
  const listAfterStatus = await getOrdersVersion()
  check(listAfterStatus !== listAfterCreate, "list fingerprint did not change after a status change")
  check((await getOrderVersion(doomed)) !== orderBefore, "order fingerprint did not change after a status change")
  await new Promise((resolve) => setTimeout(resolve, 5))
  await setManagerNote(doomed, "нотатка")
  check((await getOrdersVersion()) !== listAfterStatus, "list fingerprint did not change after a note")

  // 6. Permanent deletion: only from the status the manager saw, items go with the order
  const doomedRow = await db.order.findUniqueOrThrow({ where: { number: doomed }, include: { items: true } })
  check(doomedRow.items.length > 0, "test order has no items")
  const staleDelete = await deleteOrder(doomed, "NEW")
  check(!staleDelete.ok && staleDelete.reason === "stale" && staleDelete.current === "CONTACTED", `stale delete: ${JSON.stringify(staleDelete)}`)
  check((await getOrderByNumber(doomed)) !== null, "a stale delete removed the order")
  const listBeforeDelete = await getOrdersVersion()
  check((await deleteOrder(doomed, "CONTACTED")).ok, "order was not deleted")
  check((await getOrderByNumber(doomed)) === null, "order still exists after deletion")
  check((await db.orderItem.count({ where: { orderId: doomedRow.id } })) === 0, "order items were not deleted with the order")
  check((await db.product.count({ where: { id: doomedRow.items[0].productId! } })) === 1, "deleting an order removed a product")
  check((await getOrdersVersion()) !== listBeforeDelete, "list fingerprint did not change after a deletion")
  check((await getOrderVersion(doomed)) === "deleted", "deleted order still has a fingerprint")
  const again = await deleteOrder(doomed, "CONTACTED")
  check(!again.ok && again.reason === "not_found", "deleting a missing order did not report not_found")
  check((await getOrderByNumber(number)) !== null && (await getOrderByNumber(other)) !== null, "deletion touched other orders")

  // 7. Sign-in throttling
  const login = `check-${Date.now()}`
  check((await checkLoginAllowed(login, null)).allowed, "fresh login is throttled")
  for (let attempt = 0; attempt < 5; attempt++) await recordLoginFailure(login, null)
  const blocked = await checkLoginAllowed(login, null)
  check(!blocked.allowed && blocked.retryAfterMinutes > 0 && blocked.retryAfterMinutes <= 15, "5 failures do not throttle")
  check((await checkLoginAllowed(`${login}-other`, null)).allowed, "throttle leaks to another login")
  await clearLoginFailures(login, null)
  check((await checkLoginAllowed(login, null)).allowed, "throttle not cleared")

  // A stranger's failures from one address lock only that address, not the manager elsewhere
  const manager = `${login}-manager`
  for (let attempt = 0; attempt < 5; attempt++) await recordLoginFailure(manager, "203.0.113.7")
  check(!(await checkLoginAllowed(manager, "203.0.113.7")).allowed, "5 failures from one address do not throttle it")
  check((await checkLoginAllowed(manager, "198.51.100.2")).allowed, "one address locked the login for everyone")
  check((await checkLoginAllowed(`${manager}-2`, "203.0.113.7")).allowed, "pair limit leaked to another login")

  // Distributed guessing of one login is still capped, by the higher per-login limit
  for (let attempt = 0; attempt < 25; attempt++) await recordLoginFailure(manager, `192.0.2.${attempt + 1}`)
  check(!(await checkLoginAllowed(manager, "198.51.100.2")).allowed, "30 failures from many addresses do not throttle the login")

  // Success forgives that address only
  await clearLoginFailures(manager, "203.0.113.7")
  check((await checkLoginAllowed(manager, "203.0.113.7")).allowed, "clearing an address did not lift its own limit")
  check((await db.adminLoginAttempt.count({ where: { login: manager } })) === 25, "clearing one address removed other addresses' failures")
  await db.adminLoginAttempt.deleteMany({ where: { login: { startsWith: login } } })

  // 8. Housekeeping: expired sessions and stale rate-limit records go, current ones stay
  const day = 24 * 60 * 60 * 1000
  const tag = `purge-check-${Date.now()}`
  const tester = await db.adminUser.create({ data: { login: tag, name: tag, passwordHash: "x" } })
  try {
    await db.adminSession.createMany({
      data: [
        { tokenHash: `${tag}-expired`, adminId: tester.id, expiresAt: new Date(Date.now() - 1000) },
        { tokenHash: `${tag}-valid`, adminId: tester.id, expiresAt: new Date(Date.now() + day) },
      ],
    })
    await db.adminLoginAttempt.createMany({
      data: [
        { login: tag, ip: null, createdAt: new Date(Date.now() - 2 * day) },
        { login: tag, ip: null },
      ],
    })
    await db.orderAttempt.createMany({
      data: [
        { phone: "+380509991111", ip: tag, createdAt: new Date(Date.now() - 2 * day) },
        { phone: "+380509991111", ip: tag },
      ],
    })
    const cleaned = await cleanupExpired()
    check(cleaned.sessions >= 1 && cleaned.loginAttempts >= 1 && cleaned.orderAttempts >= 1, "cleanup removed nothing")
    check((await db.adminSession.count({ where: { adminId: tester.id } })) === 1, "cleanup must keep only the valid session")
    check((await db.adminLoginAttempt.count({ where: { login: tag } })) === 1, "cleanup must keep recent sign-in failures")
    check((await db.orderAttempt.count({ where: { ip: tag } })) === 1, "cleanup must keep recent order records")

    // 9. Retention: only old finished orders are purged, and a dry run deletes nothing
    const old = new Date(Date.now() - 800 * day)
    const mk = (status: OrderStatusValue, createdAt: Date, name: string) =>
      db.order.create({
        data: {
          status,
          createdAt,
          customerName: `${tag}-${name}`,
          customerPhone: "+380509991112",
          customerCity: "Київ",
          subtotalMinor: 0,
          items: { create: [] },
        },
        select: { id: true },
      })
    const [oldDone, oldCancelled, oldNew, oldConfirmed, freshDone] = await Promise.all([
      mk("COMPLETED", old, "old-done"),
      mk("CANCELLED", old, "old-cancelled"),
      mk("NEW", old, "old-new"),
      mk("CONFIRMED", old, "old-confirmed"),
      mk("COMPLETED", new Date(), "fresh-done"),
    ])
    const exists = async (id: string) => (await db.order.count({ where: { id } })) === 1

    const dry = await purgeOrders({ olderThanMonths: 24, dryRun: true })
    check(dry.dryRun && dry.count >= 2, `dry run should report the two old finished orders, got ${dry.count}`)
    check((await exists(oldDone.id)) && (await exists(oldCancelled.id)), "a dry run deleted orders")

    const purged = await purgeOrders({ olderThanMonths: 24, dryRun: false })
    check(purged.count >= 2, "purge deleted nothing")
    check(!(await exists(oldDone.id)) && !(await exists(oldCancelled.id)), "old finished orders were not purged")
    check((await exists(oldNew.id)) && (await exists(oldConfirmed.id)), "purge deleted an order still in progress")
    check(await exists(freshDone.id), "purge deleted a recent order")

    for (const months of [0, -1, 1.5, Number.NaN]) {
      await purgeOrders({ olderThanMonths: months, dryRun: true }).then(
        () => check(false, `purgeOrders accepted ${months} months`),
        () => undefined
      )
    }
  } finally {
    await db.order.deleteMany({ where: { customerName: { startsWith: tag } } })
    await db.orderAttempt.deleteMany({ where: { ip: tag } })
    await db.adminLoginAttempt.deleteMany({ where: { login: tag } })
    await db.adminUser.delete({ where: { id: tester.id } })
  }
}

main()
  .catch((error) => failures.push(String(error)))
  .finally(async () => {
    await db.order.deleteMany({ where: { number: { in: created } } })
    await db.orderAttempt.deleteMany({ where: { createdAt: { gte: startedAt } } })
    await db.$disconnect()
    if (failures.length) {
      console.error(`✗ Admin check failed:\n${failures.map((f) => `  - ${f}`).join("\n")}`)
      process.exitCode = 1
    } else {
      console.log("✓ Admin: password hashing, 25 status transitions, notes, search, live fingerprints, deletion, sign-in throttling, cleanup and order retention behave correctly")
    }
  })
