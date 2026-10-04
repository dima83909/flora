import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import { buildFooterShopNav, footerCustomerNav, siteConfig } from "@/config/site"
import { getCategories } from "@/server/catalog"

export async function SiteFooter() {
  const { contacts } = siteConfig
  const footerNav = [
    { title: "Магазин", items: buildFooterShopNav(await getCategories()) },
    { title: "Клієнтам", items: footerCustomerNav },
  ]

  return (
    <footer className="mt-auto border-t bg-linen/70">
      <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-ink-soft">
            Квіткова майстерня. Збираємо букети й доставляємо їх по всій Україні.
          </p>
          {contacts.telegramUrl ? (
            <a
              href={contacts.telegramUrl}
              className="mt-6 inline-flex items-center text-[0.9375rem] text-ink underline-offset-4 hover:underline any-pointer-coarse:min-h-11"
              target="_blank"
              rel="noreferrer"
            >
              Telegram
            </a>
          ) : null}
        </div>

        {footerNav.map((group) => (
          <nav key={group.title} aria-label={group.title} className="md:col-span-2">
            <h2 className="font-sans text-sm font-medium text-ink">{group.title}</h2>
            <ul className="mt-4 space-y-3 any-pointer-coarse:space-y-0">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex items-center text-[0.9375rem] text-ink-soft transition-colors hover:text-ink any-pointer-coarse:min-h-11">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Shown only once real details are set in siteConfig.contacts */}
        {contacts.address || contacts.openingHours ? (
          <div className="md:col-span-3">
            <h2 className="font-sans text-sm font-medium text-ink">Майстерня</h2>
            <address className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-ink-soft not-italic">
              {contacts.address ? <p>{contacts.address}</p> : null}
              {contacts.openingHours ? <p>{contacts.openingHours}</p> : null}
            </address>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border/80">
        <div className="container-page flex flex-col gap-2 py-6 text-[0.8125rem] text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Замовлення букетів онлайн з доставкою по Україні.</p>
          <p>Доставку й оплату узгоджує менеджер у Telegram</p>
        </div>
      </div>
    </footer>
  )
}
