# Flora — квіткова майстерня

Інтернет-магазин квітів на Next.js (App Router), TypeScript, Tailwind CSS v4 і shadcn/ui.

## Команди

```bash
npm run dev     # dev-сервер на http://localhost:3000
npm run build   # production build
npm run lint    # ESLint
npx tsc --noEmit  # перевірка типів
```

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
- `src/lib/catalog.ts` — фільтрація, сортування, параметри URL
- `src/lib/stores` — клієнтські стори кошика й обраного (localStorage)
- `src/config/site.ts` — назва, контакти, навігація
- `src/data` — тимчасові дані: каталог, доставка, догляд за квітами
- `src/types` — спільні типи
