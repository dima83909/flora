"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

/** Storefront error message shared by the root and storefront error boundaries */
export function ErrorContent({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="container-page section-y">
      <div className="max-w-xl">
        <h1 className="text-title font-light text-ink">Не вдалося завантажити сторінку</h1>
        <div role="alert">
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Сталася помилка на нашому боці. Спробуйте ще раз за хвилину.
          </p>
          {error.digest ? <p className="mt-3 text-sm text-muted-foreground">Код помилки: {error.digest}</p> : null}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={() => retry()}>
            Спробувати ще раз
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent">
            {/* A plain anchor on purpose: a full reload clears the broken state */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/">На головну</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
