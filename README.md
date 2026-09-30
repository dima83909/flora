# Flora — квіткова майстерня

Інтернет-магазин квітів на Next.js (App Router), TypeScript, Tailwind CSS v4 і shadcn/ui.

## Команди

```bash
npm run dev     # dev-сервер на http://localhost:3000
npm run build   # production build
npm run lint    # ESLint
npx tsc --noEmit  # перевірка типів
```

## База даних (PostgreSQL + Prisma)

Схема: `prisma/schema.prisma`, міграції: `prisma/migrations`, налаштування CLI: `prisma.config.ts`.
Гроші зберігаються цілими числами в копійках (`...Minor`), без чисел з плаваючою комою.

### 1. Встановити PostgreSQL

macOS (Homebrew):

```bash
brew install postgresql@16
brew services start postgresql@16
```

Або Docker:

```bash
docker run --name flora-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
```

### 2. Створити базу й задати `DATABASE_URL`

```bash
createdb flora_dev
cp .env.example .env
```

У `.env` вкажіть рядок підключення, наприклад `postgresql://YOUR_MAC_USER@localhost:5432/flora_dev`
(Homebrew) або `postgresql://postgres:postgres@localhost:5432/flora_dev` (Docker).
Файл `.env` не комітиться.

### 3. Міграції та seed

```bash
npm run db:migrate   # застосувати міграції (dev), згенерувати клієнт
npm run db:seed      # перенести 7 категорій і 23 товари з src/data у базу
npm run db:check     # перевірити, що дані з бази збігаються з каталогом сайту
```

Seed ідемпотентний: повторний запуск оновлює записи за slug і нічого не видаляє.
На сервері замість `db:migrate` використовуйте `npm run db:deploy`.

Інші команди: `npm run db:generate`, `npm run db:validate`, `npm run db:studio`.

### Доступ до даних

Сторінки не працюють з Prisma напряму. Серверний каталог — `src/server/catalog`
(`getCategories`, `getProducts`, `filterProducts`, `searchProducts`, `getProductBySlug`,
`getProductSlugs`) повертає ті самі типи `Product`/`Category`, що й mock-дані.
Поки frontend ще читає `src/data`; перехід на базу — наступний крок.

## Маршрути

- `/` — головна
- `/bouquets` — каталог; категорія, пошук, ціна та сортування задаються параметрами URL (`?category=roses&q=…`)
- `/bouquets/[slug]` — сторінка товару (статично генерується для кожного товару)
- `/favorites` — обране, зберігається в localStorage (noindex)
- `/sitemap.xml`, `/robots.txt`

## Структура

- `src/app` — маршрути, root layout, глобальні стилі та дизайн-токени (`globals.css`)
- `src/components/ui` — примітиви shadcn/ui
- `src/components/layout` — header, footer, мобільне меню
- `src/components/home` — секції головної сторінки
- `src/components/brand` — логотип і SVG-ілюстрації букетів (плейсхолдери до фотозйомки)
- `src/components/shop` — картка товару, ціна, бейджі, обране, кнопка «в кошик»
- `src/components/catalog` — сторінка каталогу: фільтри, сортування, пошук, empty state
- `src/components/product` — галерея та блок покупки сторінки товару
- `src/components/cart` — кнопка й бічна панель кошика
- `src/components/search` — пошук у header
- `src/components/favorites` — сторінка обраного
- `src/lib/catalog.ts` — фільтрація, сортування, параметри URL
- `src/lib/stores` — клієнтські стори кошика й обраного (localStorage)
- `src/server` — серверний код: клієнт бази (`db.ts`) і сервіс каталогу
- `src/generated/prisma` — згенерований клієнт Prisma (не комітиться, створюється `npm install`)
- `prisma/` — схема, міграції, seed; `scripts/check-catalog.ts` — перевірка даних
- `src/lib/structured-data.ts` — JSON-LD товарів; фото додаються через поле `images` у даних товару
- `src/config/site.ts` — назва, контакти, навігація
- `src/data` — тимчасові дані: каталог, доставка, догляд за квітами
- `src/types` — спільні типи
