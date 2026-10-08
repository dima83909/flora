/*
 * Identifiers that arrive from URLs, forms and server action payloads. They are
 * untrusted, so every entry point checks them with these guards before a query.
 */

/** Database ids are CUIDs: Latin letters and digits */
export function isRecordId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]{1,100}$/i.test(value)
}

/** Order numbers come from a sequence that starts at 1001; nine digits leave ample room */
export const ORDER_NUMBER_MAX = 999_999_999

export function isOrderNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1 && value <= ORDER_NUMBER_MAX
}

/** An order number typed in a URL or a form field ("1042"); null for anything else */
export function parseOrderNumber(value: unknown): number | null {
  return typeof value === "string" && /^[1-9]\d{0,8}$/.test(value) ? Number(value) : null
}
