import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <section className="container-page section-y">
      <div className="max-w-xl">
        <h1 className="text-title font-light text-ink">Цієї сторінки ще немає</h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          Каталог зараз наповнюється. Поверніться на головну або напишіть флористу, і ми
          підберемо букет вручну.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">На головну</Link>
        </Button>
      </div>
    </section>
  )
}
