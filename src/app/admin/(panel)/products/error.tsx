"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function AdminProductsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div role="alert" className="rounded-2xl border bg-card px-6 py-16 text-center">
      <h1 className="font-sans text-lg font-medium text-ink">Не вдалося завантажити товари</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        Схоже, немає зв&apos;язку з базою даних. Спробуйте ще раз за хвилину.
        {error.digest ? <span className="mt-2 block text-xs text-muted-foreground">Код помилки: {error.digest}</span> : null}
      </p>
      <Button className="mt-6" onClick={() => retry()}>
        Спробувати ще раз
      </Button>
    </div>
  )
}
