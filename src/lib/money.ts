/** Money is stored in minor units (kopiykas) and shown in whole hryvnias. 1 UAH = 100. */
export const MINOR_UNITS_PER_UAH = 100

export function toMinor(uah: number) {
  return Math.round(uah * MINOR_UNITS_PER_UAH)
}

export function fromMinor(minor: number) {
  return minor / MINOR_UNITS_PER_UAH
}

const wholeFormatter = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 })
const exactFormatter = new Intl.NumberFormat("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * An amount in kopiykas as the storefront and the admin panel show it: 2 450 ₴, or 2 450,50 ₴
 * when it has kopiykas. Never rounds to whole hryvnias, so every screen shows the amount the
 * order stores. A no-break space keeps the sign on the same line as the number.
 */
export function formatMinor(minor: number) {
  const formatter = minor % MINOR_UNITS_PER_UAH === 0 ? wholeFormatter : exactFormatter
  return `${formatter.format(minor / MINOR_UNITS_PER_UAH)}\u00a0₴`
}
