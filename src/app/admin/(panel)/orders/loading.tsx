export default function AdminOrdersLoading() {
  return (
    <div role="status" aria-label="Завантажуємо замовлення" className="animate-pulse">
      <div className="h-8 w-44 rounded-lg bg-linen" />
      <div className="mt-5 flex gap-1.5 overflow-hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-9 w-28 shrink-0 rounded-full bg-linen" />
        ))}
      </div>
      <div className="mt-5 divide-y overflow-hidden rounded-2xl border bg-card">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <div className="h-4 w-14 rounded bg-linen" />
            <div className="h-4 flex-1 rounded bg-linen" />
            <div className="hidden h-4 w-24 rounded bg-linen md:block" />
            <div className="h-6 w-24 rounded-full bg-linen" />
          </div>
        ))}
      </div>
    </div>
  )
}
