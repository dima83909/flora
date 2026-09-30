# Flora — квіткова майстерня

Інтернет-магазин квітів на Next.js (App Router), TypeScript, Tailwind CSS v4 і shadcn/ui.

## Команди

```bash
npm run dev     # dev-сервер на http://localhost:3000
npm run build   # production build
npm run lint    # ESLint
npx tsc --noEmit  # перевірка типів
```

## Дані магазину та домен

Реальні бізнес-дані задаються централізовано й лише тоді, коли вони підтверджені:

- `NEXT_PUBLIC_SITE_URL` (у `.env`) — публічний домен, наприклад `https://example.com`. Поки не
  заданий, сайт не виводить canonical, `og:url`, абсолютні URL у JSON-LD, а `sitemap.xml` порожній.
- `siteConfig.contacts` у `src/config/site.ts`: `telegramUrl`, `address`, `openingHours`.
  Незаповнені поля не показуються (кнопки Telegram, блок «Майстерня» у footer, години в меню).

Вигаданих контактів, адрес чи домену в коді немає; телефону й Instagram у магазину немає.

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
npm run db:seed      # завантажити 7 категорій і 23 товари з prisma/seed-data
npm run db:check     # перевірити дані й фільтри каталогу через серверний сервіс
```

Seed ідемпотентний: повторний запуск оновлює записи за slug і нічого не видаляє.
На сервері замість `db:migrate` використовуйте `npm run db:deploy`.

Інші команди: `npm run db:generate`, `npm run db:validate`, `npm run db:studio`.

### Доступ до даних

Каталог (товари, категорії, меню, ціни, наявність) живе лише в базі. `npm run dev` і
`npm run build` потребують `DATABASE_URL`: сторінки пререндеряться з даних бази й
оновлюються не рідше ніж раз на 5 хвилин (`revalidate` у `src/app/layout.tsx`).

Сторінки не працюють з Prisma напряму. Серверний каталог `src/server/catalog`
(`getCategories`, `getProducts`, `getFeaturedProducts`, `getFeaturedCategories`,
`filterProducts`, `searchProducts`, `getProductBySlug`, `getRelatedProducts`,
`getProductSlugs`) повертає прості серіалізовані об'єкти `Product`/`Category`.
Клієнтські компоненти (кошик, пошук, обране, меню) отримують їх через `CatalogProvider`,
а кошик і обране поки зберігаються в localStorage за slug товару.

## Замовлення (guest checkout)

Модель: товари → кошик (localStorage) → замовлення без реєстрації → менеджер пише клієнту в Telegram.
Доставка по всій Україні. Онлайн-оплати, акаунтів і розрахунку доставки немає: адресу, дату,
час, вартість доставки й спосіб оплати менеджер узгоджує з клієнтом у Telegram (телефон клієнта
з замовлення). Публічного телефону й Instagram у магазину немає; посилання на Telegram задається
в `siteConfig.contacts.telegramUrl` і, поки його немає, кнопки «Написати в Telegram» приховані.

- `/checkout` — форма: ім'я, телефон, місто, коментар. Валідація спільною Zod-схемою
  (`src/lib/order-schema.ts`) у браузері й на сервері; телефон нормалізується до `+380…`.
- Server action `placeOrder` → `src/server/orders/create-order.ts`: браузер надсилає лише slug і
  кількість; ціни, наявність і сума беруться з PostgreSQL, замовлення й позиції створюються
  в одній транзакції. Позиції зберігають знімок товару (назва, склад, ціна).
- `/order-success/[number]` — підтвердження з номером замовлення (номери з 1001), без даних клієнта.
- `src/server/orders/queries.ts` — запити для майбутньої адмінки (список, деталі, зміна статусу
  NEW → CONTACTED → CONFIRMED → COMPLETED / CANCELLED). Поки не підключені до жодного маршруту:
  їх можна відкривати лише за авторизацією менеджера.

`npm run db:check` також перевіряє створення замовлень (ціни з бази, валідацію, наявність,
транзакційність) і видаляє тестові замовлення після себе.

## Маршрути

- `/` — головна
- `/bouquets` — каталог; категорія, пошук, ціна та сортування задаються параметрами URL (`?category=roses&q=…`)
- `/bouquets/[slug]` — сторінка товару (статично генерується для кожного товару)
- `/favorites` — обране, зберігається в localStorage (noindex)
- `/checkout` — оформлення замовлення (noindex)
- `/order-success/[number]` — підтвердження замовлення (noindex)
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
- `prisma/` — схема, міграції, seed і початкові дані каталогу (`prisma/seed-data`); `scripts/check-catalog.ts` — перевірка даних
- `src/lib/structured-data.ts` — JSON-LD товарів; фото додаються через поле `images` у даних товару
- `src/config/site.ts` — назва, контакти, навігація
- `src/data` — контент, що не є каталогом: доставка, квіти тижня
- `src/types` — спільні типи
