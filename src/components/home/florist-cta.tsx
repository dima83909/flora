import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"

export function FloristCta() {
  return (
    <section aria-labelledby="florist-title" className="section-y">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="florist-title" className="text-title font-light text-ink">
            Потрібен особливий букет?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
            Опишіть привід, улюблені кольори й бюджет. Флорист запропонує склад і надішле
            ескіз протягом пів години.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href={siteConfig.contacts.telegram} target="_blank" rel="noreferrer">
                Написати в Telegram
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent">
              <a href={siteConfig.contacts.phoneHref}>Зателефонувати</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
