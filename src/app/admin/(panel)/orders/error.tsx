"use client"

import { AdminErrorCard } from "@/components/admin/error-card"

export default function AdminOrdersError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <AdminErrorCard
      title="Не вдалося завантажити замовлення"
      message="Схоже, немає зв'язку з базою даних. Замовлення не втрачено: спробуйте ще раз за хвилину."
      error={error}
      retry={retry}
    />
  )
}
