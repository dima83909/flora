"use client"

import { AdminErrorCard } from "@/components/admin/error-card"

/**
 * Errors from the admin panel layout and the sign-in page. Order and product pages have
 * their own boundaries. Only a retry is offered: every admin link passes through the
 * same layout, so it would land on this error again.
 */
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <AdminErrorCard
        title="Не вдалося завантажити сторінку"
        message="Схоже, немає зв'язку з базою даних. Спробуйте ще раз за хвилину."
        error={error}
        retry={retry}
      />
    </main>
  )
}
