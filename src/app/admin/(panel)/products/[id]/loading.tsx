export default function AdminProductLoading() {
  return (
    <div role="status" aria-label="Завантажуємо товар" className="animate-pulse">
      <div className="h-4 w-24 rounded bg-linen" />
      <div className="mt-4 h-8 w-72 max-w-full rounded-lg bg-linen" />
      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-96 rounded-2xl border bg-card" />
        <div className="h-72 rounded-2xl border bg-card" />
      </div>
    </div>
  )
}
