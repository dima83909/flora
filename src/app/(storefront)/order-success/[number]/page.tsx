import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { parseOrderNumber } from "@/lib/ids"
import { orderExists } from "@/server/orders/queries"

export const metadata: Metadata = {
  title: "Замовлення оформлено",
  robots: { index: false, follow: false },
}

// Order numbers are sequential, so the page shows the number only, never customer data
export default async function OrderSuccessPage({ params }: PageProps<"/order-success/[number]">) {
  const number = parseOrderNumber((await params).number)
  if (number === null || !(await orderExists(number))) notFound()

  return (
    <section className="container-page section-y">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-moss text-paper">
          <CheckIcon aria-hidden className="size-7" strokeWidth={1.8} />
        </span>
        <h1 className="mt-8 text-title font-light text-ink">Дякуємо за замовлення!</h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          Наш менеджер зв&apos;яжеться з вами найближчим часом.
        </p>
        <p className="mt-8 rounded-2xl bg-linen/70 px-6 py-4">
          <span className="block text-sm text-ink-soft">Номер замовлення</span>
          <span className="mt-1 block font-heading text-3xl text-ink tabular-nums">№ {number}</span>
        </p>
        <p className="mt-8 max-w-md text-[0.9375rem] leading-relaxed text-ink-soft">
          Менеджер напише вам у Telegram на номер, який ви вказали, і уточнить адресу, дату й
          час доставки, її вартість і спосіб оплати.
        </p>
        <Button asChild size="lg" variant="outline" className="mt-9 bg-transparent">
          <Link href="/bouquets">Повернутися до каталогу</Link>
        </Button>
      </div>
    </section>
  )
}
