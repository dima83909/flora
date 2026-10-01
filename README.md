# Flora — квіткова майстерня

Інтернет-магазин квітів на Next.js (App Router), TypeScript, Tailwind CSS v4 і shadcn/ui.

## Команди

```bash
npm run dev     # dev-сервер на http://localhost:3000
npm run build   # production build
npm run lint    # ESLint
npm test        # unit-тести Vitest (чиста логіка, без бази)
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
- **Захист від спаму**: у формі є прихований honeypot-поле `website` (людина його не бачить; якщо воно
  заповнене, замовлення відхиляється). Крім того, `src/server/orders/rate-limit.ts` рахує оформлені замовлення
  в таблиці `order_attempts`: не більше 5 на один телефон і 10 з однієї IP за годину. Ліміт по IP діє лише за
  `TRUST_PROXY=1` (див. нижче), ліміт по телефону — завжди. Невдалі спроби (недоступні товари, помилки
  форми) не рахуються. Записи старші за добу видаляються при оформленні замовлень.
- `/order-success/[number]` — підтвердження з номером замовлення (номери з 1001), без даних клієнта.
- `src/server/orders/queries.ts` — запити менеджера (пошук, деталі, зміна статусу, нотатка). Самі
  авторизацію не перевіряють: застосунок звертається до них лише через `src/server/admin/orders.ts`.

`npm run db:check` також перевіряє створення замовлень (ціни з бази, валідацію, наявність,
транзакційність) і видаляє тестові замовлення після себе.

## Адмін-панель менеджера

`/admin` — службовий розділ для обробки замовлень. Акаунтів покупців немає й не з'являється:
вхід існує лише для менеджера.

Створити адміністратора (або змінити пароль — це також завершує всі його сесії):

```bash
ADMIN_LOGIN=manager ADMIN_NAME="Ім'я менеджера" ADMIN_PASSWORD='не менше 12 символів' npm run admin:create
```

Пароль передається лише через змінну середовища й ніде не зберігається у відкритому вигляді.

- **Автентифікація** (`src/server/admin`): пароль хешується `scrypt` зі стандартної бібліотеки
  Node (без нових залежностей). Сесія зберігається в PostgreSQL (`admin_sessions`): у cookie
  лежить випадковий 256-бітний токен, у базі — лише його SHA-256. Cookie `HttpOnly`, `SameSite=Lax`,
  `Secure` у production, `Path=/admin`, діє 7 днів. Вихід видаляє сесію з бази.
- **Авторизація**: єдина перевірка — `requireAdmin()`. Її викликає кожна сторінка `/admin/*`,
  кожен server action і кожна функція даних у `src/server/admin/orders.ts`. Без чинної сесії —
  redirect на `/admin/login`; приховування UI захистом не вважається.
- **Статуси** (`src/lib/order-status.ts`): NEW → CONTACTED → CONFIRMED → COMPLETED, скасувати можна
  з NEW, CONTACTED і CONFIRMED; COMPLETED і CANCELLED — кінцеві. Сервер перевіряє перехід за тією
  самою таблицею і змінює статус лише якщо замовлення досі в тому статусі, який бачив менеджер.
- **Пошук і фільтри** виконуються в базі; стан зберігається в URL (`?status=NEW&q=львів&page=2`).
- **Оновлення наживо**: відкрита сторінка списку або замовлення раз на 10 секунд питає в сервера короткий
  «відбиток» замовлень (кількість, найбільший номер, час останньої зміни) і перемальовується лише коли він
  змінився. Пошук, фільтр і сторінка лишаються ті самі. У прихованій вкладці запитів немає.
- **Видалення**: зі сторінки замовлення, з підтвердженням; це справжній `DELETE`, позиції видаляються каскадом.
  Як і зміна статусу, спрацьовує лише якщо замовлення досі в тому статусі, який бачив менеджер.
- **Захист від перебору** (`src/server/admin/login-throttle.ts`, таблиця `admin_login_attempts`), вікно 15 хвилин:
  5 невдалих спроб для пари «логін + IP», 30 для логіну з будь-яких адрес, 20 з однієї IP для всіх логінів.
  Так сторонній не може заблокувати менеджера кількома запитами, а розподілений перебір паролю все одно обмежений.
  Успішний вхід скидає лічильник лише для своєї пари «логін + IP».

Для production:

- сайт має працювати лише через HTTPS (інакше cookie `Secure` не надсилатиметься);
- IP для ліміту спроб береться з `X-Forwarded-For` лише коли задано `TRUST_PROXY=1`. Вмикайте її тільки за reverse
  proxy/CDN (у Vercel — так), який перезаписує цей заголовок. Без неї заголовок ігнорується, IP невідомий
  і ліміти рахуються лише на логін (5 спроб за 15 хвилин, без розрізнення адрес);
- варто додати rate limiting на рівні проксі/CDN для `/admin/login` і для створення замовлень.

`npm run db:check` також перевіряє хешування паролів, усі 25 пар переходів статусів, нотатки,
пошук і ліміт спроб входу.

## Обслуговування даних

Дві команди читають `DATABASE_URL` (для production підставте її в команді, як і для `admin:create`).
Логіка в `src/server/maintenance.ts`.

```bash
# Прострочені сесії адмінки та записи лімітів (входи, замовлення) старші за добу.
# Безпечно запускати будь-коли; зручно щодоби з cron.
npm run maintenance:cleanup

# Видалення завершених (COMPLETED, CANCELLED) замовлень, оформлених понад N місяців тому,
# щоб не зберігати імена й телефони клієнтів безстроково. Замовлення в роботі
# (NEW, CONTACTED, CONFIRMED) не чіпаються. Видалення незворотне.
PURGE_MONTHS=24 npm run orders:purge                  # лише показати, скільки буде видалено
PURGE_MONTHS=24 PURGE_CONFIRM=1 npm run orders:purge  # видалити
```

Без `PURGE_MONTHS` команда нічого не робить і завершується помилкою. Термін зберігання визначає власник
магазину; у політиці конфіденційності (`/privacy`) він має збігатися з тим, що ви реально застосовуєте.
Обидві команди перевіряє `npm run db:check`.

## Юридичні сторінки та бренд

- `/privacy` і `/offer` беруть реквізити продавця з `src/config/legal.ts`. Поки поле не заповнене, на сторінці
  стоїть видима позначка «потрібно вказати», а сторінка закрита від індексації.
- Іконки й зображення для соцмереж лежать у `src/app` (`icon.svg`, `favicon.ico`, `apple-icon.png`,
  `opengraph-image.png`); `node scripts/brand/generate.mjs` перемальовує їх із SVG-джерел (потрібна macOS).

## Deploy на Vercel

Змінні середовища проєкту у Vercel (Production; для Preview — окрема база або ті самі значення):

| Змінна | Обов'язкова | Значення |
|---|---|---|
| `DATABASE_URL` | так | рядок підключення до PostgreSQL для застосунку. Для serverless бажано pooled-адресу провайдера, з `sslmode=require` |
| `NEXT_PUBLIC_SITE_URL` | ні | публічна адреса сайту без слеша в кінці. Без неї немає canonical, `og:url`, `og:image`, URL у JSON-LD і записів у sitemap. Вбудовується під час збірки: після зміни потрібен redeploy |
| `TRUST_PROXY` | рекомендована | `1`, якщо застосунок працює за proxy/CDN, що перезаписує `X-Forwarded-For` (Vercel — так). Вмикає ліміти по IP для спроб входу в адмінку й оформлення замовлень |
| `DIRECT_URL` | ні, лише локально | необов'язкове пряме підключення для Prisma CLI (міграції), якщо `DATABASE_URL` іде через pooler. Seed і `admin:create` її не читають: вони, як і сам застосунок, використовують `DATABASE_URL`. У Vercel не потрібна: міграції там не запускаються |

Особливості:

- **База потрібна під час збірки.** Головна, сторінки товарів, checkout, обране й sitemap пререндеряться з каталогу,
  тож `DATABASE_URL` має бути доступна на етапі Build, а база — вже з міграціями й каталогом.
- **Міграції не запускаються автоматично.** Перед deploy, який змінює схему, виконайте `npm run db:deploy`
  зі своєї машини з production-рядком підключення.
- **Seed запускається з репозиторію**, бо підключає фото, які знайшов у `public/images/products`.
- **`npm run db:check` не для production-бази:** він створює й видаляє тестові замовлення.
- Prisma Client генерується в `postinstall`; для цього база не потрібна.

Перший deploy:

```bash
# 1. схема й каталог у production-базі. Усі три команди читають DATABASE_URL;
#    для міграцій підставте пряме (не pooled) підключення
DATABASE_URL='<direct production url>' npm run db:deploy
DATABASE_URL='<direct production url>' npm run db:seed

# 2. адміністратор
DATABASE_URL='<direct production url>' ADMIN_LOGIN=<login> ADMIN_NAME='<name>' ADMIN_PASSWORD='<12+ символів>' npm run admin:create
```

Після цього додайте змінні у Vercel і запустіть deploy (framework preset Next.js, команди збірки за замовчуванням).

## Маршрути

- `/` — головна
- `/bouquets` — каталог; категорія, пошук, ціна та сортування задаються параметрами URL (`?category=roses&q=…`)
- `/bouquets/[slug]` — сторінка товару (статично генерується для кожного товару)
- `/favorites` — обране, зберігається в localStorage (noindex)
- `/checkout` — оформлення замовлення (noindex)
- `/order-success/[number]` — підтвердження замовлення (noindex)
- `/admin/login`, `/admin/orders`, `/admin/orders/[number]` — адмін-панель (noindex, закрита в robots.txt)
- `/privacy`, `/offer` — політика конфіденційності та публічна оферта
- `/sitemap.xml`, `/robots.txt`

## Структура

- `src/app` — root layout (шрифти, документ), глобальні стилі та дизайн-токени (`globals.css`)
- `src/app/(storefront)` — маршрути магазину зі своїм header і footer
- `src/app/admin` — адмін-панель зі своїм layout; `src/components/admin` — її компоненти
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
- `src/server` — серверний код: клієнт бази (`db.ts`), сервіс каталогу, замовлення, автентифікація адміна
- `src/generated/prisma` — згенерований клієнт Prisma (не комітиться, створюється `npm install`)
- `prisma/` — схема, міграції, seed і початкові дані каталогу (`prisma/seed-data`); `scripts/check-catalog.ts` — перевірка даних
- `src/lib/structured-data.ts` — JSON-LD товарів; фото додаються через поле `images` у даних товару
- `src/config/site.ts` — назва, контакти, навігація
- `src/data` — контент, що не є каталогом: кроки доставки
- `src/types` — спільні типи
