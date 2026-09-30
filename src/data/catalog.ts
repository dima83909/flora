import type { Category, CategorySlug, Product } from "@/types/catalog"

// Mock catalogue until products come from a real data source.

export const categories: Category[] = [
  {
    slug: "bouquets",
    name: "Букети",
    description: "Авторські збірні букети з квітів, що приїхали цього тижня",
    visual: { kind: "bouquet", variant: "blush" },
    featured: true,
  },
  {
    slug: "roses",
    name: "Троянди",
    description: "Кенійські, еквадорські та садові троянди без зайвого декору",
    visual: { kind: "bouquet", variant: "rose-cream" },
    featured: true,
  },
  {
    slug: "peonies",
    name: "Півонії",
    description: "Восени привозимо з Чилі та Нової Зеландії під замовлення",
    visual: { kind: "bouquet", variant: "peony-pink" },
    featured: true,
  },
  {
    slug: "tulips",
    name: "Тюльпани",
    description: "Голландські тюльпани з теплиць, від 15 стебел",
    visual: { kind: "bouquet", variant: "tulip-pink" },
  },
  {
    slug: "arrangements",
    name: "Композиції",
    description: "Квіти в кераміці, яка залишиться у вас після букета",
    visual: { kind: "bouquet", variant: "hydrangea", container: "vase" },
  },
  {
    slug: "boxes",
    name: "Квіти в коробках",
    description: "Не потребують вази, стоять до двох тижнів на флористичній губці",
    visual: { kind: "bouquet", variant: "berry", container: "box" },
    featured: true,
  },
  {
    slug: "gifts",
    name: "Подарунки",
    description: "Свічки, кераміка й шоколад, які можна додати до квітів",
    visual: { kind: "gift", variant: "candle" },
    featured: true,
  },
]

export const products: Product[] = [
  // Букети
  {
    slug: "morning-in-provence",
    name: "Ранок у Провансі",
    category: "bouquets",
    composition: "Піоновидні троянди, лаванда, евкаліпт цинерея",
    stems: ["5 піоновидних троянд Pink O’Hara", "3 кущові троянди Bombastic", "Лаванда", "Евкаліпт цинерея", "Лагурус"],
    description:
      "Пудрові піоновидні троянди з м’якими сріблястими гілками евкаліпта. Букет, який доречний і на день народження, і просто так у вівторок.",
    size: "Висота 45 см, діаметр 35 см",
    price: 2450,
    label: "popular",
    availability: "in_stock",
    popularity: 98,
    addedAt: "2026-05-12",
    visual: { kind: "bouquet", variant: "blush" },
  },
  {
    slug: "autumn-garden",
    name: "Осінній сад",
    category: "bouquets",
    composition: "Гортензія, айстри, хризантема сантіні, лагурус",
    stems: ["Гортензія Magical", "7 айстр", "5 хризантем сантіні", "Лагурус", "Евкаліпт"],
    description:
      "Приглушені бузкові та оливкові відтінки вересня. Айстри привозимо з господарства під Обуховом, гортензію з Нідерландів.",
    size: "Висота 50 см, діаметр 40 см",
    price: 2100,
    label: "new",
    availability: "in_stock",
    popularity: 84,
    addedAt: "2026-09-18",
    visual: { kind: "bouquet", variant: "autumn" },
  },
  {
    slug: "quiet-harbour",
    name: "Тиха гавань",
    category: "bouquets",
    composition: "Білі ранункулюси, озантус, фісташка",
    stems: ["9 білих ранункулюсів", "Озантус", "Гілки фісташки", "Евкаліпт популус"],
    description:
      "Вершкові ранункулюси з тонкими пелюстками, як із паперу. Спокійний букет для подяки, вибачення чи виписки з пологового.",
    size: "Висота 40 см, діаметр 30 см",
    price: 1980,
    oldPrice: 2300,
    availability: "in_stock",
    popularity: 76,
    addedAt: "2026-04-02",
    visual: { kind: "bouquet", variant: "ivory" },
  },
  {
    slug: "berry-sorbet",
    name: "Ягідний сорбет",
    category: "bouquets",
    composition: "Кущові троянди, диантус, гіперикум",
    stems: ["5 кущових троянд", "3 диантуси", "Гіперикум", "Евкаліпт"],
    description:
      "Соковиті малинові й рожеві відтінки з темними ягодами гіперикуму. Невеликий, але дуже яскравий.",
    size: "Висота 38 см, діаметр 28 см",
    price: 1650,
    label: "popular",
    availability: "low_stock",
    popularity: 92,
    addedAt: "2026-06-20",
    visual: { kind: "bouquet", variant: "berry" },
  },
  {
    slug: "september-meadow",
    name: "Вересневий луг",
    category: "bouquets",
    composition: "Айстри, лагурус, сантіні, польові трави",
    stems: ["9 айстр білих і бузкових", "Хризантема сантіні", "Лагурус", "Сухі польові трави"],
    description:
      "Легкий букет, ніби зібраний на прогулянці за містом. Добре стоїть, а трави потім можна засушити.",
    size: "Висота 42 см, діаметр 32 см",
    price: 1350,
    availability: "in_stock",
    popularity: 61,
    addedAt: "2026-09-05",
    visual: { kind: "bouquet", variant: "meadow" },
  },
  {
    slug: "peach-evening",
    name: "Персиковий вечір",
    category: "bouquets",
    composition: "Троянди Peach Avalanche, хризантеми, евкаліпт",
    stems: ["5 троянд Peach Avalanche", "Піоновидна троянда", "3 хризантеми", "Евкаліпт цинерея", "Лагурус"],
    description:
      "Теплі персикові й абрикосові відтінки для тих, хто не любить класичний рожевий. Особливо гарний у вечірньому світлі.",
    size: "Висота 48 см, діаметр 38 см",
    price: 2750,
    label: "new",
    availability: "in_stock",
    popularity: 70,
    addedAt: "2026-09-22",
    visual: { kind: "bouquet", variant: "peach" },
  },

  // Троянди
  {
    slug: "red-roses-25",
    name: "25 червоних троянд",
    category: "roses",
    composition: "Троянди Explorer, Еквадор, 60 см",
    stems: ["25 троянд Explorer, 60 см"],
    description:
      "Класичні червоні троянди з великим бутоном у графітовому папері. Без гіпсофіли й зайвої зелені.",
    size: "Висота 60 см, діаметр 35 см",
    price: 2900,
    label: "popular",
    availability: "in_stock",
    popularity: 95,
    addedAt: "2026-02-01",
    visual: { kind: "bouquet", variant: "rose-red" },
  },
  {
    slug: "cream-garden-roses",
    name: "Кремові садові троянди",
    category: "roses",
    composition: "Садові троянди Keira, евкаліпт",
    stems: ["11 садових троянд Keira", "Евкаліпт цинерея"],
    description:
      "Багатопелюсткові троянди з легким ароматом, які розкриваються за два-три дні й стають схожими на півонії.",
    size: "Висота 45 см, діаметр 35 см",
    price: 3400,
    availability: "in_stock",
    popularity: 80,
    addedAt: "2026-07-14",
    visual: { kind: "bouquet", variant: "rose-cream" },
  },
  {
    slug: "pink-spray-roses",
    name: "Кущові троянди Bombastic",
    category: "roses",
    composition: "Кущові троянди Lady Bombastic, 15 гілок",
    stems: ["15 гілок кущових троянд Lady Bombastic"],
    description:
      "Маленькі кулясті бутони на кожній гілці, тож букет виглядає пишним навіть у невеликому розмірі.",
    size: "Висота 40 см, діаметр 32 см",
    price: 1850,
    oldPrice: 2150,
    availability: "in_stock",
    popularity: 74,
    addedAt: "2026-03-10",
    visual: { kind: "bouquet", variant: "rose-spray" },
  },
  {
    slug: "red-roses-51",
    name: "51 червона троянда",
    category: "roses",
    composition: "Троянди Explorer, Еквадор, 70 см",
    stems: ["51 троянда Explorer, 70 см"],
    description:
      "Великий букет для пропозиції чи ювілею. Збираємо в день доставки, тому просимо замовляти за кілька годин.",
    size: "Висота 70 см, діаметр 50 см",
    price: 5900,
    availability: "low_stock",
    popularity: 66,
    addedAt: "2026-02-01",
    visual: { kind: "bouquet", variant: "rose-red" },
  },

  // Півонії
  {
    slug: "pink-peony",
    name: "Рожеві півонії Sarah Bernhardt",
    category: "peonies",
    composition: "Півонії Sarah Bernhardt, 11 стебел",
    stems: ["11 півоній Sarah Bernhardt"],
    description:
      "Той самий ніжно-рожевий сорт з ароматом, який усі чекають у червні. Восени привозимо з Нової Зеландії під замовлення.",
    size: "Висота 50 см, діаметр 40 см",
    price: 3200,
    label: "popular",
    availability: "preorder",
    leadDays: 3,
    popularity: 90,
    addedAt: "2026-05-20",
    visual: { kind: "bouquet", variant: "peony-pink" },
  },
  {
    slug: "coral-peony",
    name: "Коралові півонії Coral Charm",
    category: "peonies",
    composition: "Півонії Coral Charm, евкаліпт",
    stems: ["9 півоній Coral Charm", "Евкаліпт цинерея"],
    description:
      "Сорт, що змінює колір: розкривається яскраво-кораловим і за кілька днів стає персиковим.",
    size: "Висота 50 см, діаметр 38 см",
    price: 3600,
    label: "new",
    availability: "preorder",
    leadDays: 3,
    popularity: 72,
    addedAt: "2026-09-25",
    visual: { kind: "bouquet", variant: "peony-coral" },
  },
  {
    slug: "white-peony",
    name: "Білі півонії Duchesse de Nemours",
    category: "peonies",
    composition: "Півонії Duchesse de Nemours, евкаліпт",
    stems: ["11 білих півоній Duchesse de Nemours", "Евкаліпт популус"],
    description:
      "Молочно-білі півонії з вершковою серединкою. Улюблений сорт наречених, поставки чекаємо з листопада.",
    size: "Висота 50 см, діаметр 40 см",
    price: 3400,
    availability: "out_of_stock",
    popularity: 58,
    addedAt: "2026-05-28",
    visual: { kind: "bouquet", variant: "peony-white" },
  },

  // Тюльпани
  {
    slug: "pink-tulips",
    name: "Рожеві тюльпани",
    category: "tulips",
    composition: "Тюльпани Dynasty, 25 стебел",
    stems: ["25 тюльпанів Dynasty"],
    description:
      "Ніжно-рожеві голландські тюльпани, перев’язані лляною стрічкою. Бутони відкриваються в теплі за кілька годин.",
    size: "Висота 40 см, діаметр 30 см",
    price: 1450,
    availability: "preorder",
    leadDays: 2,
    popularity: 68,
    addedAt: "2026-02-15",
    visual: { kind: "bouquet", variant: "tulip-pink" },
  },
  {
    slug: "white-tulips-eucalyptus",
    name: "Білі тюльпани з евкаліптом",
    category: "tulips",
    composition: "Тюльпани White Prince, евкаліпт",
    stems: ["21 тюльпан White Prince", "Евкаліпт цинерея"],
    description: "Білі тюльпани й сріблясто-зелений евкаліпт. Стриманий букет, який пасує до будь-якого інтер’єру.",
    size: "Висота 42 см, діаметр 30 см",
    price: 1600,
    availability: "preorder",
    leadDays: 2,
    popularity: 55,
    addedAt: "2026-02-15",
    visual: { kind: "bouquet", variant: "tulip-white" },
  },

  // Композиції
  {
    slug: "hydrangea-ceramic",
    name: "Гортензії в кераміці",
    category: "arrangements",
    composition: "Три гортензії у вазі ручної роботи",
    stems: ["3 гортензії: зелена, блакитна, бузкова", "Керамічна ваза, Васильків"],
    description:
      "Композиція у вазі від майстрів з Василькова. Коли квіти відцвітуть, ваза залишиться у вас.",
    size: "Висота 35 см, діаметр 30 см",
    price: 2600,
    label: "popular",
    availability: "in_stock",
    popularity: 86,
    addedAt: "2026-06-02",
    visual: { kind: "bouquet", variant: "hydrangea", container: "vase" },
  },
  {
    slug: "autumn-still-life",
    name: "Осінній натюрморт",
    category: "arrangements",
    composition: "Гортензія, айстри, сантіні у вазі",
    stems: ["Гортензія", "5 айстр", "Хризантема сантіні", "Лагурус", "Керамічна ваза"],
    description: "Невисока композиція для столу, яку не треба перебирати й підрізати. Достатньо доливати воду.",
    size: "Висота 30 см, діаметр 28 см",
    price: 2300,
    availability: "in_stock",
    popularity: 60,
    addedAt: "2026-09-12",
    visual: { kind: "bouquet", variant: "autumn", container: "vase" },
  },

  // Квіти в коробках
  {
    slug: "blush-hatbox",
    name: "Коробка «Пудра»",
    category: "boxes",
    composition: "Піоновидні троянди, евкаліпт у капелюшній коробці",
    stems: ["7 піоновидних троянд", "3 кущові троянди", "Евкаліпт", "Флористична губка"],
    description: "Кругла капелюшна коробка з квітами на губці. Зручно везти в офіс чи в ресторан, вази не потрібно.",
    size: "Діаметр коробки 20 см, висота 30 см",
    price: 2200,
    label: "popular",
    availability: "in_stock",
    popularity: 88,
    addedAt: "2026-04-18",
    visual: { kind: "bouquet", variant: "blush", container: "box" },
  },
  {
    slug: "berry-jam-box",
    name: "Коробка «Ягідний джем»",
    category: "boxes",
    composition: "Кущові троянди, диантус, гіперикум",
    stems: ["5 кущових троянд", "3 диантуси", "Гіперикум", "Флористична губка"],
    description: "Яскрава коробка з малиновими трояндами й ягодами. Стоїть до двох тижнів, якщо поливати губку.",
    size: "Діаметр коробки 18 см, висота 28 см",
    price: 1900,
    oldPrice: 2200,
    availability: "in_stock",
    popularity: 64,
    addedAt: "2026-06-30",
    visual: { kind: "bouquet", variant: "berry", container: "box" },
  },
  {
    slug: "cream-box",
    name: "Коробка «Вершки»",
    category: "boxes",
    composition: "Білі ранункулюси, троянди, озантус",
    stems: ["7 ранункулюсів", "3 кремові троянди", "Озантус", "Флористична губка"],
    description: "Світла коробка у вершкових тонах. Часто замовляють колегам і лікарям як подяку.",
    size: "Діаметр коробки 20 см, висота 28 см",
    price: 2400,
    label: "new",
    availability: "in_stock",
    popularity: 62,
    addedAt: "2026-09-15",
    visual: { kind: "bouquet", variant: "ivory", container: "box" },
  },

  // Подарунки
  {
    slug: "fig-cedar-candle",
    name: "Свічка «Інжир і кедр»",
    category: "gifts",
    composition: "Соєвий віск, бавовняний гніт, 200 мл",
    stems: ["Соєвий віск", "Бавовняний гніт", "Скляна банка 200 мл", "Горить близько 40 годин"],
    description: "Свічка київської майстерні з теплим ароматом інжиру й кедра. Гарно доповнює осінні букети.",
    size: "Висота 9 см, діаметр 8 см",
    price: 690,
    availability: "in_stock",
    popularity: 50,
    addedAt: "2026-09-01",
    visual: { kind: "gift", variant: "candle" },
  },
  {
    slug: "ceramic-vase",
    name: "Керамічна ваза ручної роботи",
    category: "gifts",
    composition: "Глина, матова глазур, висота 22 см",
    stems: ["Шамотна глина", "Матова глазур", "Кожна ваза трохи відрізняється"],
    description: "Ваза від кераміків з Василькова. Підходить для букетів діаметром до 35 см.",
    size: "Висота 22 см, діаметр горла 7 см",
    price: 1150,
    availability: "low_stock",
    popularity: 48,
    addedAt: "2026-07-08",
    visual: { kind: "gift", variant: "vase" },
  },
  {
    slug: "handmade-chocolates",
    name: "Цукерки ручної роботи",
    category: "gifts",
    composition: "9 цукерок: карамель, малина, фісташка",
    stems: ["3 з солоною карамеллю", "3 з малиною", "3 з фісташкою", "Бельгійський шоколад"],
    description: "Цукерки львівської шоколатьє в коробці кольору моху. Термін зберігання 21 день.",
    size: "Коробка 12 × 12 см",
    price: 540,
    label: "new",
    availability: "in_stock",
    popularity: 45,
    addedAt: "2026-09-20",
    visual: { kind: "gift", variant: "chocolate" },
  },
]

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug)
}

export function getCategory(slug: CategorySlug) {
  return categories.find((category) => category.slug === slug)
}

export function isCategorySlug(value: string | null | undefined): value is CategorySlug {
  return categories.some((category) => category.slug === value)
}

export function getCategoryMinPrice(slug: CategorySlug) {
  return Math.min(...products.filter((p) => p.category === slug).map((p) => p.price))
}

export const popularProducts = products
  .filter((product) => product.label === "popular")
  .sort((a, b) => b.popularity - a.popularity)
  .slice(0, 4)

/** Same category first, then the most popular items from elsewhere */
export function getRelatedProducts(product: Product, limit = 4) {
  const others = products.filter((p) => p.slug !== product.slug && p.availability !== "out_of_stock")
  const sameCategory = others.filter((p) => p.category === product.category)
  const rest = others
    .filter((p) => p.category !== product.category && p.category !== "gifts")
    .sort((a, b) => b.popularity - a.popularity)
  return [...sameCategory, ...rest].slice(0, limit)
}

/** Flowers that arrived at the studio this week (shown in the hero) */
export const weeklyStems = [
  "Гортензія Magical, Нідерланди",
  "Кущові троянди Bombastic",
  "Айстри з господарства під Обуховом",
  "Евкаліпт цинерея",
  "Лагурус і сухий лунарій",
]
