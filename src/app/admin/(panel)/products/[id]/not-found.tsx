import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function AdminProductNotFound() {
  return (
    <div className="rounded-2xl border bg-card px-6 py-16 text-center">
      <h1 className="font-sans text-lg font-medium text-ink">Такого товару немає</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        Можливо, його вже видалили. Знайдіть товар у загальному списку.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/admin/products">До списку товарів</Link>
      </Button>
    </div>
  )
}
