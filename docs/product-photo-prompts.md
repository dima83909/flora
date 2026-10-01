# Промпти для фото товарів

Одне головне фото на товар: `public/images/products/<slug>/main.webp`, портрет 4:5
(наприклад 1600 × 2000 px). Склад у промптах узято з `prisma/seed-data/catalog.ts` без змін.

Після того як файли лежать у папках:

```bash
npm run db:seed
```

Seed сам підключає фото, які знайшов на диску (`main.webp`, пізніше `detail-1.webp`, `detail-2.webp`).
Товари без файлу й далі показують ілюстрацію.

Конвертація в WebP, якщо генератор віддає PNG або JPG:

```bash
cwebp -q 82 -resize 1600 2000 input.png -o public/images/products/<slug>/main.webp
```

## Спільний стиль (додавати до кожного промпту)

> Photorealistic premium florist product photograph, one product centred, shot straight-on at
> a slight downward angle, portrait 4:5. Warm natural studio light from the left, subtle soft
> shadow, seamless warm white background (#f6f1ea), clean and minimal. Realistic flowers with
> natural proportions and texture, muted true-to-life colours, high-end editorial look,
> consistent framing with the product filling about 70% of the height.
> No people, no hands, no text, no labels, no logos, no watermark, no props, no extra flowers
> beyond the listed composition, no CGI or plastic look, no heavy bokeh, no oversaturation.

## Букети

| slug | Промпт |
|---|---|
| `morning-in-provence` | Hand-tied bouquet, about 45 cm tall and 35 cm wide: 5 blush pink peony-shaped garden roses (Pink O'Hara), 3 stems of pale pink spray roses, sprigs of lavender, silver-grey eucalyptus cinerea, a few lagurus (bunny tail) grasses. Powdery pink and silver-green palette, wrapped in plain cream paper. |
| `autumn-garden` | Hand-tied bouquet, about 50 cm tall and 40 cm wide: one large hydrangea head in muted lilac-green, 7 asters, 5 small santini chrysanthemums, lagurus grasses, eucalyptus. Muted lilac and olive palette, wrapped in plain kraft paper. |
| `quiet-harbour` | Hand-tied bouquet, about 40 cm tall and 30 cm wide: 9 white-cream ranunculus with thin papery petals, white ozothamnus (rice flower), pistachio foliage branches, round-leaf eucalyptus populus. Calm cream and green palette, wrapped in plain ivory paper. |
| `berry-sorbet` | Small hand-tied bouquet, about 38 cm tall and 28 cm wide: 5 stems of raspberry-pink spray roses, 3 pink dianthus (carnations), dark red hypericum berries, eucalyptus. Raspberry and pink palette, wrapped in plain white paper. |
| `september-meadow` | Light airy hand-tied bouquet, about 42 cm tall and 32 cm wide: 9 white and lilac asters, small santini chrysanthemums, lagurus grasses, dried meadow grasses. Loose natural field look, wrapped in plain kraft paper. |
| `peach-evening` | Hand-tied bouquet, about 48 cm tall and 38 cm wide: 5 peach roses (Peach Avalanche), one peach peony-shaped garden rose, 3 chrysanthemums in apricot tones, silver eucalyptus cinerea, lagurus grasses. Warm peach and apricot palette, wrapped in plain cream paper. |

## Троянди

| slug | Промпт |
|---|---|
| `red-roses-25` | Bouquet of exactly 25 classic red roses with large heads on 60 cm stems, no filler flowers and no extra greenery, wrapped in matte graphite-grey paper. |
| `cream-garden-roses` | Bouquet of 11 cream multi-petalled garden roses (Keira type, cream with a faint blush centre) with silver eucalyptus cinerea, about 45 cm tall, wrapped in plain cream paper. |
| `pink-spray-roses` | Bouquet of 15 stems of pale pink spray roses with small round ball-shaped buds (Lady Bombastic), full and rounded, about 40 cm tall, wrapped in plain white paper. |
| `red-roses-51` | Large bouquet of 51 classic red roses with large heads on 70 cm stems, dense round dome about 50 cm wide, no filler flowers, wrapped in matte graphite-grey paper. |

## Півонії

| slug | Промпт |
|---|---|
| `pink-peony` | Bouquet of 11 soft pink double peonies (Sarah Bernhardt), about 50 cm tall and 40 cm wide, own foliage only, wrapped in plain cream paper. |
| `coral-peony` | Bouquet of 9 coral peonies (Coral Charm, semi-double with golden centres) with silver eucalyptus cinerea, about 50 cm tall, wrapped in plain cream paper. |
| `white-peony` | Bouquet of 11 milky white double peonies with creamy centres (Duchesse de Nemours) with round-leaf eucalyptus populus, about 50 cm tall, wrapped in plain ivory paper. |

## Тюльпани

| slug | Промпт |
|---|---|
| `pink-tulips` | Bouquet of 25 soft pink tulips (Dynasty: pink with a white base), about 40 cm tall, stems tied with a natural linen ribbon, no wrapping paper. |
| `white-tulips-eucalyptus` | Bouquet of 21 white tulips with silver-green eucalyptus cinerea, about 42 cm tall, restrained and minimal, wrapped in plain white paper. |

## Композиції

| slug | Промпт |
|---|---|
| `hydrangea-ceramic` | Arrangement of 3 hydrangea heads (one green, one light blue, one lilac) in a simple handmade matte ceramic vase, about 35 cm tall overall. Flowers and vase read as one product. |
| `autumn-still-life` | Low table arrangement, about 30 cm tall and 28 cm wide, in a simple matte ceramic vase: one hydrangea head, 5 asters, santini chrysanthemums, lagurus grasses. Muted autumn lilac and olive palette. |

## Квіти в коробках

| slug | Промпт |
|---|---|
| `blush-hatbox` | Round hat box, 20 cm in diameter, plain with no print, filled with 7 blush pink peony-shaped roses, 3 stems of pink spray roses and eucalyptus; about 30 cm tall overall. |
| `berry-jam-box` | Round flower box, 18 cm in diameter, plain with no print, filled with 5 stems of raspberry-pink spray roses, 3 pink dianthus and dark red hypericum berries; about 28 cm tall overall. |
| `cream-box` | Round flower box, 20 cm in diameter, plain with no print, filled with 7 white ranunculus, 3 cream roses and white ozothamnus; cream palette, about 28 cm tall overall. |

## Подарунки

| slug | Промпт |
|---|---|
| `fig-cedar-candle` | Single unlit soy wax candle in a plain clear glass jar, about 9 cm tall and 8 cm in diameter, cotton wick, cream-coloured wax, no label and no lid. |
| `ceramic-vase` | Single empty handmade ceramic vase, 22 cm tall with a narrow 7 cm neck, chamotte clay with a matte glaze, slightly irregular handmade shape, neutral warm tone. |
| `handmade-chocolates` | Open square moss-green box, 12 × 12 cm, plain with no branding, holding 9 handmade chocolates in a 3 × 3 grid: 3 salted caramel, 3 raspberry, 3 pistachio. |
