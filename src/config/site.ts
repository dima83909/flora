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

export const mainNav: NavItem[] = [
  { title: "Каталог", href: "/bouquets" },
  { title: "Троянди", href: "/bouquets?category=roses" },
  { title: "Півонії", href: "/bouquets?category=peonies" },
  { title: "Квіти в коробках", href: "/bouquets?category=boxes" },
  { title: "Подарунки", href: "/bouquets?category=gifts" },
  { title: "Доставка", href: "/#delivery" },
]

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Магазин",
    items: [
      { title: "Усі букети", href: "/bouquets" },
      { title: "Композиції", href: "/bouquets?category=arrangements" },
      { title: "Тюльпани", href: "/bouquets?category=tulips" },
      { title: "Обране", href: "/favorites" },
    ],
  },
  {
    title: "Клієнтам",
    items: [
      { title: "Доставка й оплата", href: "/#delivery" },
      { title: "Нові надходження", href: "/bouquets?sort=new" },
    ],
  },
]
