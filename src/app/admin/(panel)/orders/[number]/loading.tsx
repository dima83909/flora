export default function AdminOrderLoading() {
  return (
    <div role="status" aria-label="Завантажуємо замовлення" className="animate-pulse">
      <div className="h-4 w-32 rounded bg-linen" />
      <div className="mt-4 h-8 w-64 rounded-lg bg-linen" />
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-72 rounded-2xl border bg-card" />
        <div className="h-72 rounded-2xl border bg-card" />
      </div>
    </div>
  )
}
