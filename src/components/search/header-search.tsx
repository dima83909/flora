"use client"

import { useDeferredValue, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SearchIcon, XIcon } from "lucide-react"

import { useCatalog } from "@/components/catalog/catalog-provider"
import { Price } from "@/components/shop/price"
import { ProductImage } from "@/components/shop/product-image"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { pluralize, searchProducts } from "@/lib/catalog"

const MAX_RESULTS = 5
const SUGGESTIONS = ["Півонії", "Троянди", "Коробка", "Евкаліпт", "Тюльпани", "Свічка"]

export function HeaderSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const { products, categories, getCategory } = useCatalog()

  const matches = searchProducts(products, deferredQuery, undefined, categories)
  const visible = matches.slice(0, MAX_RESULTS)
  const trimmed = query.trim()
  const allResultsHref = `/bouquets?q=${encodeURIComponent(trimmed)}`

  function showAll() {
    if (!trimmed) return
    setOpen(false)
    router.push(allResultsHref)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Пошук">
          <SearchIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="top"
        showCloseButton={false}
        className="max-h-dvh gap-0 overflow-y-auto border-b-0 bg-paper p-0"
      >
        <SheetTitle className="sr-only">Пошук</SheetTitle>
        <SheetDescription className="sr-only">
          Знайдіть букет за назвою, квіткою або категорією
        </SheetDescription>

        <div className="container-page max-w-3xl! pt-4 pb-6 md:pt-8 md:pb-10">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              showAll()
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <SearchIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <label htmlFor="header-search" className="sr-only">
                Пошук у каталозі
              </label>
              <input
                id="header-search"
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Півонії, евкаліпт, коробка…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 w-full rounded-full border border-input bg-card pr-4 pl-12 text-base text-ink outline-none placeholder:text-muted-foreground focus-visible:border-stem focus-visible:ring-3 focus-visible:ring-stem/20 md:h-14 md:text-lg [&::-webkit-search-cancel-button]:hidden"
              />
            </div>
            <SheetClose asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Закрити пошук" className="size-12 shrink-0">
                <XIcon className="size-5" />
              </Button>
            </SheetClose>
          </form>

          <div aria-live="polite" className="sr-only">
            {trimmed
              ? `${matches.length} ${pluralize(matches.length, ["результат", "результати", "результатів"])}`
              : ""}
          </div>

          {!trimmed ? (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-ink-soft">Часто шукають</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => setQuery(suggestion)}
                      className="h-10 rounded-full border border-input px-4 text-[0.9375rem] text-ink transition-colors hover:border-stem hover:bg-linen"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : visible.length ? (
            <div className="mt-4">
              <ul className="divide-y divide-border/70">
                {visible.map((product) => (
                  <li key={product.slug}>
                    <Link
                      href={`/bouquets/${product.slug}`}
                      onClick={() => setOpen(false)}
                      className="-mx-3 flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-linen"
                    >
                      <span className="block aspect-4/5 w-14 shrink-0 overflow-hidden rounded-xl">
                        <ProductImage visual={product.visual} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-heading text-[1.0625rem] text-ink">{product.name}</span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {getCategory(product.category)?.name}
                        </span>
                      </span>
                      <Price price={product.price} oldPrice={product.oldPrice} className="shrink-0 flex-col items-end gap-0" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" variant="outline" className="mt-5 w-full bg-transparent sm:w-auto">
                <Link href={allResultsHref} onClick={() => setOpen(false)}>
                  Показати всі результати ({matches.length})
                </Link>
              </Button>
            </div>
          ) : (
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-ink-soft">
              За запитом «{trimmed}» нічого не знайшли. Спробуйте назву квітки, кольору або{" "}
              <Link href="/bouquets" onClick={() => setOpen(false)} className="text-ink underline underline-offset-4">
                перегляньте весь каталог
              </Link>
              .
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
