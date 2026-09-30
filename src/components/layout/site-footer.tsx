import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import { footerNav, siteConfig } from "@/config/site"

export function SiteFooter() {
  const { contacts } = siteConfig

  return (
    <footer className="mt-auto border-t bg-linen/70">
      <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-ink-soft">
            Квіткова майстерня на Ярославовому Валу. Збираємо букети з сезонних квітів
            і привозимо їх по Києву щодня.
          </p>
          <div className="mt-6 flex gap-5 text-[0.9375rem]">
            <a href={contacts.instagram} className="text-ink underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href={contacts.telegram} className="text-ink underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
              Telegram
            </a>
          </div>
        </div>

        {footerNav.map((group) => (
          <nav key={group.title} aria-label={group.title} className="md:col-span-2">
            <h2 className="font-sans text-sm font-medium text-ink">{group.title}</h2>
            <ul className="mt-4 space-y-3">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[0.9375rem] text-ink-soft transition-colors hover:text-ink">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="md:col-span-3">
          <h2 className="font-sans text-sm font-medium text-ink">Майстерня</h2>
          <address className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-ink-soft not-italic">
            <p>{contacts.address}</p>
            <p>{contacts.hours}</p>
            <p>
              <a href={contacts.phoneHref} className="text-ink hover:underline underline-offset-4">
                {contacts.phone}
              </a>
              <br />
              <a href={`mailto:${contacts.email}`} className="hover:text-ink">
                {contacts.email}
              </a>
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-border/80">
        <div className="container-page flex flex-col gap-2 py-6 text-[0.8125rem] text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Квіткова майстерня, Київ.</p>
          <p>Оплата карткою, Apple Pay та Google Pay</p>
        </div>
      </div>
    </footer>
  )
}
