/** Text helpers shared by the storefront, the admin panel and the server */

/** Collapses runs of whitespace, so "  Біла  Церква " and "Біла Церква" are stored the same */
export function singleLine(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

/** Longest search query the admin lists accept; longer input is cut */
export const SEARCH_QUERY_MAX = 100

/** A search box value as the admin lists and their queries use it */
export function normalizeSearchQuery(value: string | undefined) {
  return singleLine(value ?? "").slice(0, SEARCH_QUERY_MAX)
}

const pluralRules = new Intl.PluralRules("uk")

/** Ukrainian plural forms: [one, few, many], e.g. ["товар", "товари", "товарів"] */
export function pluralize(count: number, [one, few, many]: [string, string, string]) {
  const rule = pluralRules.select(count)
  if (rule === "one") return one
  if (rule === "few") return few
  return many
}
