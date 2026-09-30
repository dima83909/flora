import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"

/** Shown only once the shop's real Telegram link is configured */
export function FloristCta() {
  const { telegramUrl } = siteConfig.contacts
  if (!telegramUrl) return null

  return (
    <section aria-labelledby="florist-title" className="section-y">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="florist-title" className="text-title font-light text-ink">
            Потрібен особливий букет?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
            Опишіть у Telegram привід, улюблені кольори й бюджет, і флорист запропонує склад
            букета.
          </p>
          <Button asChild size="lg" className="mt-8">
            <a href={telegramUrl} target="_blank" rel="noreferrer">
              Написати в Telegram
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
