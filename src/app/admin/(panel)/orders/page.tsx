import type { Metadata } from "next"
import Form from "next/form"
import Link from "next/link"
import { redirect } from "next/navigation"
import { SearchIcon } from "lucide-react"

import { LiveRefresh } from "@/components/admin/live-refresh"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatMoney, formatPhone, formatShortDate, plural } from "@/lib/admin-format"
import { isOrderStatus, ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatusValue } from "@/lib/order-status"
import { cn } from "@/lib/utils"
import { requireAdmin } from "@/server/admin/auth"
import { getAdminOrdersVersion, listAdminOrders } from "@/server/admin/orders"

export const metadata: Metadata = { title: "Замовлення" }

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

type Filters = { status?: OrderStatusValue; query: string; page: number }

function ordersHref({ status, query, page }: Partial<Filters>) {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  if (query) params.set("q", query)
  if (page && page > 1) params.set("page", String(page))
  const search = params.toString()
  return search ? `/admin/orders?${search}` : "/admin/orders"
}

const columns =
  "md:grid md:grid-cols-[4.5rem_8.5rem_minmax(0,1.5fr)_minmax(0,1fr)_5.5rem_6.5rem_8rem] md:items-center md:gap-x-4"

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin()

  const params = await searchParams
  const rawStatus = first(params.status)
  const rawPage = first(params.page) ?? ""
  const filters: Filters = {
    status: isOrderStatus(rawStatus) ? rawStatus : undefined,
    query: (first(params.q) ?? "").trim().slice(0, 100),
    page: /^[1-9]\d{0,5}$/.test(rawPage) ? Number(rawPage) : 1,
  }

  // The fingerprint is read first: a change that lands between the two queries triggers one extra refresh, never a missed one
  const version = await getAdminOrdersVersion()
  const { orders, total, counts, pageCount } = await listAdminOrders(filters)
  // A page past the end (orders were filtered out, or the link is old) shows the last one
  if (filters.page > pageCount) redirect(ordersHref({ ...filters, page: pageCount }))

  const allCount = Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0)
  const filtered = Boolean(filters.status || filters.query)

  const tabs: { label: string; status?: OrderStatusValue; count: number }[] = [
    { label: "Усі", count: allCount },
    ...ORDER_STATUSES.map((status) => ({ label: ORDER_STATUS_LABELS[status], status, count: counts[status] ?? 0 })),
  ]

  return (
    <>
      <LiveRefresh version={version} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-sans text-2xl font-medium text-ink">Замовлення</h1>
        <Form action="/admin/orders" role="search" className="flex w-full gap-2 sm:max-w-md">
          {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
          <div className="relative flex-1">
            <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              defaultValue={filters.query}
              maxLength={100}
              placeholder="Номер, ім'я, телефон або місто"
              aria-label="Пошук замовлень"
              className="h-10 bg-card pr-3 pl-9 pointer-coarse:h-11"
            />
          </div>
          <Button type="submit" variant="outline">
            Знайти
          </Button>
        </Form>
      </div>

      <nav aria-label="Фільтр за статусом" className="mt-5 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-1.5">
          {tabs.map((tab) => {
            const active = tab.status === filters.status
            return (
              <li key={tab.label}>
                <Link
                  href={ordersHref({ status: tab.status, query: filters.query })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors pointer-coarse:h-11",
                    active ? "border-moss bg-moss text-paper" : "bg-card text-ink-soft hover:text-ink"
                  )}
                >
                  {tab.label}
                  <span className={cn("text-xs tabular-nums", active ? "text-paper/75" : "text-muted-foreground")}>
                    {tab.count}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {filters.query ? (
        <p className="mt-4 text-sm text-ink-soft">
          За запитом «{filters.query}»: {total} {plural(total, ["замовлення", "замовлення", "замовлень"])}.{" "}
          <Link href={ordersHref({ status: filters.status })} className="text-ink underline underline-offset-4">
            Скинути пошук
          </Link>
        </p>
      ) : null}

      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-card px-6 py-16 text-center">
          <h2 className="font-sans text-lg font-medium text-ink">
            {filtered ? "Таких замовлень немає" : "Замовлень ще немає"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            {filtered
              ? "Спробуйте інший запит або приберіть фільтр за статусом."
              : "Щойно покупець оформить замовлення на сайті, воно з'явиться тут зі статусом «Нове»."}
          </p>
          {filtered ? (
            <Button asChild variant="outline" className="mt-6">
              <Link href="/admin/orders">Показати всі замовлення</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border bg-card">
          <div aria-hidden className={cn("hidden border-b px-5 py-3 text-xs font-medium text-muted-foreground", columns)}>
            <span>Номер</span>
            <span>Створено</span>
            <span>Клієнт</span>
            <span>Місто</span>
            <span>Позицій</span>
            <span className="text-right">Сума</span>
            <span>Статус</span>
          </div>
          <ul className="divide-y">
            {orders.map((order) => {
              const isNew = order.status === "NEW"
              const lines = order._count.items
              return (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.number}`}
                    className={cn(
                      "block border-l-4 px-4 py-4 text-sm transition-colors hover:bg-linen/50 focus-visible:bg-linen/50 focus-visible:outline-none md:px-4 md:py-3.5",
                      isNew ? "border-l-rose bg-petal/45" : "border-l-transparent",
                      columns
                    )}
                  >
                    <span className="flex items-center justify-between gap-3 md:contents">
                      <span className={cn("tabular-nums", isNew ? "font-semibold text-ink" : "font-medium text-ink")}>
                        <span className="sr-only">Замовлення </span>№ {order.number}
                      </span>
                      <StatusBadge status={order.status} className="md:order-last" />
                      <time dateTime={order.createdAt.toISOString()} className="hidden text-ink-soft tabular-nums md:block">
                        {formatShortDate(order.createdAt)}
                      </time>
                    </span>

                    <span className="mt-2 block min-w-0 md:mt-0">
                      <span className={cn("block truncate text-ink", isNew && "font-medium")}>{order.customerName}</span>
                      <span className="block text-ink-soft tabular-nums">{formatPhone(order.customerPhone)}</span>
                      {order.customerComment ? (
                        <span className="mt-0.5 block truncate text-[0.8125rem] text-muted-foreground" title={order.customerComment}>
                          <span className="sr-only">Коментар: </span>«{order.customerComment}»
                        </span>
                      ) : null}
                    </span>

                    <span className="mt-1 block truncate text-ink-soft md:mt-0">{order.customerCity}</span>

                    <span className="mt-2 flex items-baseline justify-between gap-3 md:contents">
                      <span className="text-ink-soft tabular-nums">
                        {lines}
                        <span className="md:hidden"> {plural(lines, ["позиція", "позиції", "позицій"])}</span>
                        <time dateTime={order.createdAt.toISOString()} className="md:hidden">
                          {" · "}
                          {formatShortDate(order.createdAt)}
                        </time>
                      </span>
                      <span className="font-medium text-ink tabular-nums md:text-right">
                        {formatMoney(order.subtotalMinor, order.currency)}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {pageCount > 1 ? (
        <nav aria-label="Сторінки" className="mt-5 flex items-center justify-between gap-3 text-sm">
          {filters.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={ordersHref({ ...filters, page: filters.page - 1 })}>Новіші</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-ink-soft tabular-nums">
            Сторінка {filters.page} з {pageCount}
          </span>
          {filters.page < pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={ordersHref({ ...filters, page: filters.page + 1 })}>Давніші</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  )
}
