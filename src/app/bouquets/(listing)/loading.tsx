/** Shown while the catalogue renders on the server after a navigation */
export default function CatalogLoading() {
  return (
    <div className="container-page pt-6 pb-20 md:pt-8" aria-busy="true">
      <p className="sr-only" role="status">
        Завантажуємо каталог…
      </p>
      <div aria-hidden className="animate-pulse">
        <div className="h-4 w-40 rounded-full bg-linen" />
        <div className="mt-8 h-12 w-56 rounded-2xl bg-linen md:mt-12 md:h-14 md:w-72" />
        <div className="mt-5 h-5 w-full max-w-lg rounded-full bg-linen" />
        <div className="mt-10 flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-10 w-24 shrink-0 rounded-full bg-linen" />
          ))}
        </div>
        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:ml-[calc(14rem+3rem)] xl:ml-[calc(14rem+4rem)]">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i}>
              <div className="aspect-4/5 rounded-2xl bg-linen" />
              <div className="mt-4 h-5 w-3/4 rounded-full bg-linen" />
              <div className="mt-2 h-4 w-1/2 rounded-full bg-linen" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
