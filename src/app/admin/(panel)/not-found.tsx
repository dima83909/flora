import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function AdminNotFound() {
  return (
    <div className="rounded-2xl border bg-card px-6 py-16 text-center">
      <h1 className="font-sans text-lg font-medium text-ink">Такої сторінки немає</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        Перевірте адресу або перейдіть до розділу через меню.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/admin/orders">До списку замовлень</Link>
      </Button>
    </div>
  )
}
