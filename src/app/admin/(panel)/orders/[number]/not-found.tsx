import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function AdminOrderNotFound() {
  return (
    <div className="rounded-2xl border bg-card px-6 py-16 text-center">
      <h1 className="font-sans text-lg font-medium text-ink">Такого замовлення немає</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        Перевірте номер або знайдіть замовлення в загальному списку.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/admin/orders">До списку замовлень</Link>
      </Button>
    </div>
  )
}
