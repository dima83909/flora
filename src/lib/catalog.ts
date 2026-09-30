import { categories, isCategorySlug } from "@/data/catalog"
import type { Availability, CategorySlug, Product } from "@/types/catalog"

export const sortOptions = [
  { value: "popular", label: "Спочатку популярні", short: "Популярні" },
  { value: "new", label: "Спочатку нові", short: "Нові" },
  { value: "price-asc", label: "Спочатку дешевші", short: "Дешевші" },
  { value: "price-desc", label: "Спочатку дорожчі", short: "Дорожчі" },
] as const

export type SortValue = (typeof sortOptions)[number]["value"]

export const priceRanges = [
  { value: "to-1500", label: "До 1 500 ₴", min: 0, max: 1500 },
  { value: "1500-2500", label: "1 500 – 2 500 ₴", min: 1500, max: 2500 },
  { value: "2500-4000", label: "2 500 – 4 000 ₴", min: 2500, max: 4000 },
  { value: "from-4000", label: "Від 4 000 ₴", min: 4000, max: Infinity },
] as const

export type PriceRangeValue = (typeof priceRanges)[number]["value"]

export type CatalogFilters = {
  query: string
  category: CategorySlug | null
  price: PriceRangeValue | null
  inStockOnly: boolean
  favoritesOnly: boolean
  sort: SortValue
}

export const DEFAULT_SORT: SortValue = "popular"

/** URL search param names */
export const PARAM = {
  query: "q",
  category: "category",
  price: "price",
  inStock: "stock",
  favorites: "favorites",
  sort: "sort",
} as const

type ParamsLike = { get(name: string): string | null }

function isSort(value: string | null): value is SortValue {
  return sortOptions.some((option) => option.value === value)
}

function isPriceRange(value: string | null): value is PriceRangeValue {
  return priceRanges.some((range) => range.value === value)
}

export function parseFilters(params: ParamsLike): CatalogFilters {
  const category = params.get(PARAM.category)
  const price = params.get(PARAM.price)
  const sort = params.get(PARAM.sort)
  return {
    query: params.get(PARAM.query)?.trim() ?? "",
    category: isCategorySlug(category) ? category : null,
    price: isPriceRange(price) ? price : null,
    inStockOnly: params.get(PARAM.inStock) === "1",
    favoritesOnly: params.get(PARAM.favorites) === "1",
    sort: isSort(sort) ? sort : DEFAULT_SORT,
  }
}

export function filtersToSearch(filters: CatalogFilters) {
  const params = new URLSearchParams()
  if (filters.query) params.set(PARAM.query, filters.query)
  if (filters.category) params.set(PARAM.category, filters.category)
  if (filters.price) params.set(PARAM.price, filters.price)
  if (filters.inStockOnly) params.set(PARAM.inStock, "1")
  if (filters.favoritesOnly) params.set(PARAM.favorites, "1")
  if (filters.sort !== DEFAULT_SORT) params.set(PARAM.sort, filters.sort)
  const search = params.toString()
  return search ? `?${search}` : ""
}

/** Number of refinements applied in the filter panel (category chips and search excluded) */
export function countPanelFilters(filters: CatalogFilters) {
  return [filters.price, filters.inStockOnly, filters.favoritesOnly].filter(Boolean).length
}

export function hasActiveFilters(filters: CatalogFilters) {
  return Boolean(filters.query || filters.category || countPanelFilters(filters))
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("uk")
    .replace(/[’'`ʼ]/g, "")
    .replace(/ё/g, "е")
}

function matchesQuery(product: Product, query: string) {
  if (!query) return true
  const categoryName = categories.find((c) => c.slug === product.category)?.name ?? ""
  const haystack = normalize(
    [product.name, product.composition, product.stems.join(" "), categoryName].join(" ")
  )
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}

export function isPurchasable(availability: Availability) {
  return availability !== "out_of_stock"
}

export function applyFilters(
  items: Product[],
  filters: CatalogFilters,
  favorites: readonly string[]
): Product[] {
  const range = priceRanges.find((r) => r.value === filters.price)

  const result = items.filter((product) => {
    if (filters.category && product.category !== filters.category) return false
    if (range && (product.price < range.min || product.price >= range.max)) return false
    if (filters.inStockOnly && !(product.availability === "in_stock" || product.availability === "low_stock"))
      return false
    if (filters.favoritesOnly && !favorites.includes(product.slug)) return false
    return matchesQuery(product, filters.query)
  })

  const sorters: Record<SortValue, (a: Product, b: Product) => number> = {
    popular: (a, b) => b.popularity - a.popularity,
    new: (a, b) => b.addedAt.localeCompare(a.addedAt),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
  }

  // Unavailable items always sink to the end, whatever the sort
  return result.sort((a, b) => {
    const stock = Number(!isPurchasable(a.availability)) - Number(!isPurchasable(b.availability))
    return stock || sorters[filters.sort](a, b)
  })
}

export function availabilityText(product: Pick<Product, "availability" | "leadDays">) {
  switch (product.availability) {
    case "in_stock":
      return "В наявності"
    case "low_stock":
      return "Залишилось кілька штук"
    case "preorder":
      return `Під замовлення, ${product.leadDays ?? 2} ${pluralize(product.leadDays ?? 2, ["день", "дні", "днів"])}`
    case "out_of_stock":
      return "Немає в наявності"
  }
}

const pluralRules = new Intl.PluralRules("uk")

/** Ukrainian plural forms: [one, few, many] e.g. ["товар", "товари", "товарів"] */
export function pluralize(count: number, [one, few, many]: [string, string, string]) {
  const rule = pluralRules.select(count)
  if (rule === "one") return one
  if (rule === "few") return few
  return many
}

export function discountPercent(product: Pick<Product, "price" | "oldPrice">) {
  if (!product.oldPrice || product.oldPrice <= product.price) return null
  return Math.round((1 - product.price / product.oldPrice) * 100)
}
