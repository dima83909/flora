export default function AdminProductsLoading() {
  return (
    <div role="status" aria-label="Завантажуємо товари" className="animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-linen" />
        <div className="h-10 w-40 rounded-full bg-linen" />
      </div>
      <div className="mt-5 h-10 rounded-lg bg-linen" />
      <div className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-3.5">
            <div className="aspect-4/5 w-14 rounded-lg bg-linen" />
            <div className="h-4 flex-1 rounded bg-linen" />
            <div className="hidden h-4 w-24 rounded bg-linen md:block" />
            <div className="h-6 w-24 rounded-full bg-linen" />
          </div>
        ))}
      </div>
    </div>
  )
}
