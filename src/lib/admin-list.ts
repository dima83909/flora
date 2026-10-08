/*
 * Shared plumbing of the paged admin lists (orders, products): their filters live in the
 * URL, so a list can be reloaded, bookmarked and shared exactly as the manager left it.
 */

export type SearchParamValue = string | string[] | undefined

/** A repeated query parameter (?q=a&q=b) counts by its first value */
export function firstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value
}

/** ?page=N as a number; anything else is the first page */
export function parsePageParam(value: SearchParamValue) {
  const raw = firstParam(value) ?? ""
  return /^[1-9]\d{0,5}$/.test(raw) ? Number(raw) : 1
}

/** Number of pages for a result count; an empty list still has one page */
export function pageCountFor(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize))
}

/** Link to a list with these filters; empty filters and the first page stay out of the URL */
export function listHref(path: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    if (name === "page" && Number(value) <= 1) continue
    search.set(name, String(value))
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}
