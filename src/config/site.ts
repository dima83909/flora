export const siteConfig = {
  name: "Flora",
  title: "Flora — квіткова майстерня в Києві",
  description:
    "Авторські букети з сезонних квітів. Збираємо вручну, надсилаємо фото перед доставкою, привозимо по Києву того ж дня.",
  url: "https://flora.kyiv.ua",
  locale: "uk_UA",
  contacts: {
    phone: "+380 44 390 12 40",
    phoneHref: "tel:+380443901240",
    email: "hello@flora.kyiv.ua",
    address: "вул. Ярославів Вал, 14, Київ",
    hours: "Щодня з 8:00 до 21:00",
    instagram: "https://instagram.com/flora.kyiv",
    telegram: "https://t.me/flora_kyiv",
  },
  delivery: {
    sameDayCutoff: "18:00",
    freeFrom: 3000,
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
  { title: "Нові надходження", href: "/bouquets?sort=new" },
]
