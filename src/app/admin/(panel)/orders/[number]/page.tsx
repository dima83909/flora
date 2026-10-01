import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { CopyButton } from "@/components/admin/copy-button"
import { DeleteOrder } from "@/components/admin/delete-order"
import { LiveRefresh } from "@/components/admin/live-refresh"
import { ManagerNoteForm } from "@/components/admin/manager-note-form"
import { StatusActions } from "@/components/admin/status-actions"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { formatFullDate, formatMoney, formatPhone } from "@/lib/admin-format"
import { requireAdmin } from "@/server/admin/auth"
import { getAdminOrder } from "@/server/admin/orders"

const parseNumber = (raw: string) => (/^[1-9]\d{0,8}$/.test(raw) ? Number(raw) : null)

export async function generateMetadata({ params }: PageProps<"/admin/orders/[number]">): Promise<Metadata> {
  const number = parseNumber((await params).number)
  return { title: number ? `Замовлення № ${number}` : "Замовлення" }
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="font-sans text-base font-medium text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-sm text-muted-foreground sm:w-28">{label}</dt>
      <dd className="min-w-0 text-[0.9375rem] break-words text-ink">{children}</dd>
    </div>
  )
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[number]">) {
  await requireAdmin()

  const number = parseNumber((await params).number)
  const order = number ? await getAdminOrder(number) : null
  if (!order) notFound()

  return (
    <>
      <LiveRefresh version={`${order.status}:${order.updatedAt.getTime()}`} orderNumber={order.number} />
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeftIcon aria-hidden className="size-4" />
        Усі замовлення
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="font-sans text-2xl font-medium text-ink tabular-nums">Замовлення № {order.number}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Card title="Статус">
            {/* Remounted on every status change so a pending "confirm cancel" never carries over */}
            <StatusActions key={order.status} number={order.number} status={order.status} />
          </Card>

          <Card title="Склад замовлення">
            {/* Rendered from the snapshot saved with the order, not from the current catalogue */}
            <ul className="divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{item.productName}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.composition}</p>
                  </div>
                  <div className="flex shrink-0 items-baseline justify-between gap-6 tabular-nums sm:block sm:text-right">
                    <p className="text-sm text-ink-soft">
                      {item.quantity} × {formatMoney(item.unitPriceMinor, order.currency)}
                    </p>
                    <p className="font-medium text-ink sm:mt-1">{formatMoney(item.totalMinor, order.currency)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-baseline justify-between gap-6 border-t pt-4">
              <p className="text-sm text-ink-soft">
                Сума товарів, {order.currency}
                <span className="block text-xs text-muted-foreground">Доставку узгоджуєте з клієнтом окремо</span>
              </p>
              <p className="text-xl font-medium text-ink tabular-nums">{formatMoney(order.subtotalMinor, order.currency)}</p>
            </div>
          </Card>

          <Card title="Нотатка менеджера">
            <p className="-mt-2 mb-3 text-sm text-ink-soft">Бачать лише менеджери. Клієнтові вона не показується.</p>
            <ManagerNoteForm number={order.number} note={order.managerNote ?? ""} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Клієнт">
            <dl className="space-y-3">
              <Field label="Ім'я">{order.customerName}</Field>
              <Field label="Телефон">
                <span className="tabular-nums">{formatPhone(order.customerPhone)}</span>
              </Field>
              <Field label="Місто">{order.customerCity}</Field>
              <Field label="Коментар">
                {order.customerComment ? (
                  <span className="whitespace-pre-wrap">{order.customerComment}</span>
                ) : (
                  <span className="text-muted-foreground">Без коментаря</span>
                )}
              </Field>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2 border-t pt-5">
              <CopyButton value={order.customerPhone} label="Скопіювати номер" />
              <Button asChild variant="outline" size="sm">
                {/* Telegram's own link format for opening a chat by phone number */}
                <a href={`https://t.me/${order.customerPhone}`} target="_blank" rel="noreferrer">
                  Спробувати відкрити в Telegram
                </a>
              </Button>
              <p className="w-full text-xs leading-relaxed text-muted-foreground">
                Чат у Telegram відкриється, лише якщо клієнт дозволив знаходити себе за номером телефону. Якщо не
                відкрився, скопіюйте номер і знайдіть клієнта в Telegram вручну.
              </p>
            </div>
          </Card>

          <Card title="Деталі">
            <dl className="space-y-3">
              <Field label="Номер">
                <span className="tabular-nums">{order.number}</span>
              </Field>
              <Field label="Створено">
                <time dateTime={order.createdAt.toISOString()}>{formatFullDate(order.createdAt)}</time>
              </Field>
              <Field label="Оновлено">
                <time dateTime={order.updatedAt.toISOString()}>{formatFullDate(order.updatedAt)}</time>
              </Field>
              <Field label="Сума">
                <span className="tabular-nums">{formatMoney(order.subtotalMinor, order.currency)}</span>
              </Field>
              <Field label="Валюта">{order.currency}</Field>
            </dl>
          </Card>

          <Card title="Видалення">
            <p className="-mt-2 mb-3 text-sm text-ink-soft">
              Повністю прибирає замовлення з бази. Щоб лише закрити його, скасуйте замовлення в блоці «Статус».
            </p>
            {/* Remounted on every status change so an open confirmation never carries over */}
            <DeleteOrder key={order.status} number={order.number} status={order.status} />
          </Card>
        </div>
      </div>
    </>
  )
}
