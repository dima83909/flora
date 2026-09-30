"use client"

import { useId } from "react"

import { priceRanges, type CatalogFilters } from "@/lib/catalog"
import { cn } from "@/lib/utils"

type FilterPanelProps = {
  filters: CatalogFilters
  onChange: (next: Partial<CatalogFilters>) => void
  favoritesCount: number
  className?: string
}

const optionClass =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-[0.9375rem] text-ink transition-colors hover:bg-linen has-checked:bg-linen has-focus-visible:outline-2 has-focus-visible:outline-stem"

export function FilterPanel({ filters, onChange, favoritesCount, className }: FilterPanelProps) {
  // The panel renders twice (sidebar and mobile sheet); radio groups must not share a name
  const priceGroup = `price-${useId()}`
  return (
    <div className={cn("space-y-8", className)}>
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink">Ціна</legend>
        <div className="-mx-3 space-y-0.5">
          <label className={optionClass}>
            <input
              type="radio"
              name={priceGroup}
              className="size-4.5 accent-(--moss)"
              checked={filters.price === null}
              onChange={() => onChange({ price: null })}
            />
            Будь-яка
          </label>
          {priceRanges.map((range) => (
            <label key={range.value} className={optionClass}>
              <input
                type="radio"
                name={priceGroup}
                className="size-4.5 accent-(--moss)"
                checked={filters.price === range.value}
                onChange={() => onChange({ price: range.value })}
              />
              {range.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink">Показати</legend>
        <div className="-mx-3 space-y-0.5">
          <label className={optionClass}>
            <input
              type="checkbox"
              className="size-4.5 rounded accent-(--moss)"
              checked={filters.inStockOnly}
              onChange={(e) => onChange({ inStockOnly: e.target.checked })}
            />
            <span className="flex-1">Лише в наявності</span>
          </label>
          <label className={optionClass}>
            <input
              type="checkbox"
              className="size-4.5 rounded accent-(--moss)"
              checked={filters.favoritesOnly}
              onChange={(e) => onChange({ favoritesOnly: e.target.checked })}
            />
            <span className="flex-1">Обране</span>
            {favoritesCount ? (
              <span className="text-sm text-muted-foreground tabular-nums">{favoritesCount}</span>
            ) : null}
          </label>
        </div>
      </fieldset>
    </div>
  )
}
