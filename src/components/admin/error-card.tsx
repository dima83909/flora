"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

/** Body of the admin error boundaries: what failed, the error digest and a retry */
export function AdminErrorCard({
  title,
  message,
  error,
  retry,
}: {
  title: string
  message: string
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="rounded-2xl border bg-card px-6 py-16 text-center">
      <h1 className="font-sans text-lg font-medium text-ink">{title}</h1>
      <p role="alert" className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        {message}
        {error.digest ? <span className="mt-2 block text-xs text-muted-foreground">Код помилки: {error.digest}</span> : null}
      </p>
      <Button className="mt-6" onClick={() => retry()}>
        Спробувати ще раз
      </Button>
    </div>
  )
}
