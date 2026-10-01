import type { Metadata } from "next"
import Link from "next/link"

import { StorefrontShell } from "@/components/layout/storefront-shell"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Сторінку не знайдено",
  description: "Такої сторінки немає. Перейдіть на головну або в каталог букетів.",
}

export default function NotFound() {
  return (
    <StorefrontShell>
      <section className="container-page section-y">
        <div className="max-w-xl">
          <h1 className="text-title font-light text-ink">Такої сторінки немає</h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Можливо, посилання застаріло або букет прибрали з каталогу. Подивіться, що є зараз,
            або поверніться на головну.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/bouquets">Перейти до каталогу</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent">
              <Link href="/">На головну</Link>
            </Button>
          </div>
        </div>
      </section>
    </StorefrontShell>
  )
}
