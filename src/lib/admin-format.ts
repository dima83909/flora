import { formatMinor, fromMinor } from "@/lib/money"

/*
 * Formatting for the admin panel. Dates are rendered on the server in the shop's
 * time zone, so they do not depend on where the server or the browser is.
 */
const TIME_ZONE = "Europe/Kyiv"

const shortDate = new Intl.DateTimeFormat("uk-UA", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

const fullDate = new Intl.DateTimeFormat("uk-UA", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export const formatShortDate = (date: Date) => shortDate.format(date)
export const formatFullDate = (date: Date) => fullDate.format(date)

/** Exact amount in the order currency, e.g. 2 450 ₴ or 2 450,50 ₴; orders are placed in hryvnias */
export function formatMoney(minor: number, currency: string) {
  if (currency === "UAH") return formatMinor(minor)
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency }).format(fromMinor(minor))
}

/** +380501234567 → +380 50 123 45 67; other countries are shown as stored */
export function formatPhone(phone: string) {
  const match = /^\+380(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone)
  return match ? `+380 ${match[1]} ${match[2]} ${match[3]} ${match[4]}` : phone
}
