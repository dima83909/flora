"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react"

import { CatalogEmpty } from "@/components/catalog/catalog-empty"
import { FilterPanel } from "@/components/catalog/filter-panel"
import { SortSelect, SortSheet } from "@/components/catalog/sort-control"
import { ProductCard } from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { categories, getCategory, products } from "@/data/catalog"
import {
  applyFilters,
  countPanelFilters,
  DEFAULT_SORT,
  filtersToSearch,
  hasActiveFilters,
  parseFilters,
  pluralize,
  priceRanges,
  type CatalogFilters,
} from "@/lib/catalog"
import { useFavorites } from "@/lib/stores/favorites"
import { cn } from "@/lib/utils"

const EMPTY_FILTERS: CatalogFilters = {
  query: "",
  category: null,
  price: null,
  inStockOnly: false,
  favoritesOnly: false,
  sort: DEFAULT_SORT,
}

const SEARCH_DEBOUNCE_MS = 250

export function CatalogView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])
  const favorites = useFavorites()

  const results = useMemo(() => applyFilters(products, filters, favorites), [filters, favorites])
  const category = filters.category ? getCategory(filters.category) : null
  const panelCount = countPanelFilters(filters)

  // The URL is the single source of truth, so filters survive reloads, sharing and back navigation.
  // replaceState keeps filter tweaks out of history: Back returns to the previous page.
  function update(next: Partial<CatalogFilters>) {
    const search = filtersToSearch({ ...filters, ...next })
    window.history.replaceState(null, "", `${pathname}${search}`)
  }

  function reset() {
    setQueryInput("")
    window.history.replaceState(null, "", pathname + filtersToSearch({ ...EMPTY_FILTERS, sort: filters.sort }))
  }

  // Search input is local for instant typing and pushed to the URL after a short pause
  const [queryInput, setQueryInput] = useState(filters.query)
  const [syncedQuery, setSyncedQuery] = useState(filters.query)
  if (filters.query !== syncedQuery) {
    setSyncedQuery(filters.query)
    setQueryInput(filters.query)
  }
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(debounce.current), [])

  function onQueryChange(value: string) {
    setQueryInput(value)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => update({ query: value.trim() }), SEARCH_DEBOUNCE_MS)
  }

  // Header search icon links to /bouquets#catalog-search
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (window.location.hash === "#catalog-search") searchRef.current?.focus()
  }, [])

  const activeChips = [
    filters.query && { key: "query", label: `«${filters.query}»`, clear: () => { setQueryInput(""); update({ query: "" }) } },
    filters.price && {
      key: "price",
      label: priceRanges.find((r) => r.value === filters.price)?.label ?? "",
      clear: () => update({ price: null }),
    },
    filters.inStockOnly && { key: "stock", label: "Лише в наявності", clear: () => update({ inStockOnly: false }) },
    filters.favoritesOnly && { key: "fav", label: "Обране", clear: () => update({ favoritesOnly: false }) },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[]

  const resultText = `${results.length} ${pluralize(results.length, ["товар", "товари", "товарів"])}`

  return (
    <div className="container-page pb-20 md:pb-28">
      <header className="max-w-2xl pt-6 md:pt-10">
        <h1 className="text-title font-light text-ink">{category ? category.name : "Каталог"}</h1>
        <p className="mt-4 text-base leading-relaxed text-ink-soft md:text-lg">
          {category
            ? category.description
            : "Букети, композиції та подарунки майстерні. Склад може трохи змінюватися залежно від поставки, палітра лишається тією ж."}
        </p>
      </header>

      {/* Categories: scrolls inside itself on narrow screens, never the page */}
      <nav aria-label="Категорії" className="-mx-5 mt-8 md:mx-0 md:mt-10">
        <ul className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:flex-wrap md:px-0">
          {[{ slug: null, name: "Усе" }, ...categories].map((item) => {
            const active = filters.category === item.slug
            return (
              <li key={item.slug ?? "all"} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => update({ category: item.slug })}
                  className={cn(
                    "h-10 rounded-full border px-4 text-[0.9375rem] whitespace-nowrap transition-colors",
                    active
                      ? "border-moss bg-moss text-paper"
                      : "border-input bg-transparent text-ink hover:border-stem hover:bg-linen"
                  )}
                >
                  {item.name}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-3 border-b border-border/80 pb-6 md:mt-8 md:flex-row md:items-center md:gap-4">
        <div className="relative md:w-80">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="catalog-search" className="sr-only">
            Пошук у каталозі
          </label>
          <input
            ref={searchRef}
            id="catalog-search"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Півонії, евкаліпт, коробка…"
            value={queryInput}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                clearTimeout(debounce.current)
                update({ query: queryInput.trim() })
                e.currentTarget.blur()
              }
            }}
            className="h-11 w-full scroll-mt-40 rounded-full border border-input bg-card pr-10 pl-11 text-base text-ink outline-none placeholder:text-muted-foreground focus-visible:border-stem focus-visible:ring-3 focus-visible:ring-stem/20 md:text-[0.9375rem] [&::-webkit-search-cancel-button]:hidden"
          />
          {queryInput ? (
            <button
              type="button"
              onClick={() => {
                clearTimeout(debounce.current)
                setQueryInput("")
                update({ query: "" })
                searchRef.current?.focus()
              }}
              aria-label="Очистити пошук"
              className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-linen hover:text-ink"
            >
              <XIcon className="size-4" />
            </button>
          ) : null}
        </div>

        {/* Mobile: filter and sort open as bottom sheets */}
        <div className="flex gap-2 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="lg" className="h-11 min-w-0 flex-1 justify-start bg-card px-4 text-[0.9375rem] font-normal">
                <SlidersHorizontalIcon data-icon="inline-start" className="text-stem" />
                Фільтри
                {panelCount ? (
                  <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-moss text-[0.6875rem] text-paper">
                    {panelCount}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[88dvh] gap-0 rounded-t-3xl bg-paper p-0">
              <SheetHeader className="px-6 pt-6 pb-4">
                <SheetTitle className="font-heading text-2xl font-light">Фільтри</SheetTitle>
                <SheetDescription className="sr-only">Уточніть ціну та наявність</SheetDescription>
              </SheetHeader>
              <div className="overflow-y-auto px-6 pb-4">
                <FilterPanel filters={filters} onChange={update} favoritesCount={favorites.length} />
              </div>
              <SheetFooter className="flex-row gap-3 border-t px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 bg-transparent"
                  disabled={!panelCount}
                  onClick={() => update({ price: null, inStockOnly: false, favoritesOnly: false })}
                >
                  Скинути
                </Button>
                <SheetClose asChild>
                  <Button size="lg" className="flex-[1.4]">
                    Показати {resultText}
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <SortSheet value={filters.sort} onChange={(sort) => update({ sort })} />
        </div>

        <p aria-live="polite" className="text-sm text-muted-foreground md:ml-auto">
          {resultText}
        </p>
        <div className="hidden lg:block">
          <SortSelect value={filters.sort} onChange={(sort) => update({ sort })} />
        </div>
      </div>

      <div className="mt-8 lg:mt-10 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-12 xl:gap-16">
        <aside aria-label="Фільтри" className="hidden lg:block">
          <div className="sticky top-36">
            <FilterPanel filters={filters} onChange={update} favoritesCount={favorites.length} />
            {hasActiveFilters(filters) ? (
              <Button variant="link" className="mt-6 h-auto px-0 text-ink-soft" onClick={reset}>
                Скинути всі фільтри
              </Button>
            ) : null}
          </div>
        </aside>

        <section aria-label="Товари" className="min-w-0">
          {activeChips.length ? (
            <ul className="mb-6 flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    onClick={chip.clear}
                    aria-label={`Прибрати фільтр ${chip.label}`}
                    className="flex h-8 items-center gap-1.5 rounded-full bg-petal pr-2.5 pl-3.5 text-sm text-ink transition-colors hover:bg-blush"
                  >
                    {chip.label}
                    <XIcon className="size-3.5" />
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={reset} className="h-8 px-2 text-sm text-ink-soft underline-offset-4 hover:underline">
                  Скинути все
                </button>
              </li>
            </ul>
          ) : null}

          {results.length ? (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 md:gap-y-14">
              {results.map((product) => (
                <li key={product.slug} className="flex">
                  <ProductCard product={product} headingLevel="h2" />
                </li>
              ))}
            </ul>
          ) : (
            <CatalogEmpty filters={filters} hasFavorites={favorites.length > 0} onReset={reset} />
          )}
        </section>
      </div>
    </div>
  )
}
