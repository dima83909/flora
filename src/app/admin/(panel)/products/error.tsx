"use client"

import { AdminErrorCard } from "@/components/admin/error-card"

export default function AdminProductsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <AdminErrorCard
      title="Не вдалося завантажити товари"
      message="Схоже, немає зв'язку з базою даних. Спробуйте ще раз за хвилину."
      error={error}
      retry={retry}
    />
  )
}
