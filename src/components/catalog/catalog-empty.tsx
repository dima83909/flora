import { GiftArt } from "@/components/brand/gift-art"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import type { CatalogFilters } from "@/lib/catalog"

type CatalogEmptyProps = {
  filters: CatalogFilters
  hasFavorites: boolean
  onReset: () => void
}

export function CatalogEmpty({ filters, hasFavorites, onReset }: CatalogEmptyProps) {
  const onlyFavorites = filters.favoritesOnly && !hasFavorites

  const title = onlyFavorites ? "В обраному поки порожньо" : "Нічого не знайшли"
  const text = onlyFavorites
    ? "Натискайте на сердечко на картці, щоб зберегти букет і повернутися до нього пізніше."
    : filters.query
      ? `За запитом «${filters.query}» з такими фільтрами букетів немає. Спробуйте інше слово або приберіть частину фільтрів.`
      : "З такими фільтрами букетів немає. Приберіть частину фільтрів або опишіть флористу, що шукаєте, і ми зберемо букет вручну."

  return (
    <div className="flex flex-col items-center py-12 text-center md:py-20">
      <div className="arch aspect-3/4 w-32 overflow-hidden md:w-40">
        <GiftArt variant="vase" />
      </div>
      <h2 className="mt-8 text-subtitle font-light text-ink">{title}</h2>
      <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-soft">{text}</p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={onReset}>
          {onlyFavorites ? "Дивитися весь каталог" : "Скинути фільтри"}
        </Button>
        {onlyFavorites ? null : (
          <Button asChild size="lg" variant="outline" className="bg-transparent">
            <a href={siteConfig.contacts.telegram} target="_blank" rel="noreferrer">
              Написати флористу
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
