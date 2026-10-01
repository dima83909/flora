/**
 * Public origin of the storefront, e.g. https://example.com, from NEXT_PUBLIC_SITE_URL.
 * Until the real domain is set it stays undefined, and the site omits everything that
 * needs an absolute URL (canonical links, og:url, JSON-LD URLs, sitemap entries).
 */
function readSiteUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return undefined
  try {
    return new URL(raw).origin
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL must be an absolute URL like https://example.com, got "${raw}"`)
  }
}

export const siteConfig = {
  name: "Flora",
  title: "Flora — квіткова майстерня",
  description:
    "Букети й квіткові композиції з доставкою по всій Україні. Деталі доставки й оплати узгоджує менеджер у Telegram.",
  url: readSiteUrl(),
  locale: "uk_UA",
  /**
   * Confirmed business details only. Each value stays undefined until it is real;
   * the UI hides whatever is missing rather than showing a placeholder.
   */
  contacts: {
    /** Telegram is the only channel the shop uses to reach customers (https://t.me/…) */
    telegramUrl: undefined as string | undefined,
    /** Street address of a studio or pickup point, if the shop gets one */
    address: undefined as string | undefined,
    /** Human-readable opening hours, e.g. "Щодня з 9:00 до 20:00" */
    openingHours: undefined as string | undefined,
  },
} as const

export type NavItem = {
  title: string
  href: string
}

/**
 * Category with non-floral add-ons (candles, ceramics, chocolate). Changes product
 * copy (no bouquet photo or care tips) and is left out of "related" suggestions.
 */
export const GIFT_CATEGORY_SLUG = "gifts"

export function isGiftCategory(slug: string) {
  return slug === GIFT_CATEGORY_SLUG
}

export function categoryHref(slug: string) {
  return `/bouquets?category=${encodeURIComponent(slug)}`
}

/** Header navigation: the catalogue, categories flagged in the database, then delivery */
export function buildMainNav(categories: { slug: string; name: string; inNavigation?: boolean }[]): NavItem[] {
  return [
    { title: "Каталог", href: "/bouquets" },
    ...categories.filter((c) => c.inNavigation).map((c) => ({ title: c.name, href: categoryHref(c.slug) })),
    { title: "Доставка", href: "/#delivery" },
  ]
}

/** Footer shop links: everything not already in the header, plus favourites */
export function buildFooterShopNav(categories: { slug: string; name: string; inNavigation?: boolean }[]): NavItem[] {
  return [
    { title: "Увесь каталог", href: "/bouquets" },
    ...categories.filter((c) => !c.inNavigation).map((c) => ({ title: c.name, href: categoryHref(c.slug) })),
    { title: "Обране", href: "/favorites" },
  ]
}

export const footerCustomerNav: NavItem[] = [
  { title: "Доставка й оплата", href: "/#delivery" },
]
