import Link from "next/link"
import { SearchIcon } from "lucide-react"

import { Logo } from "@/components/brand/logo"
import { CartButton, CartSheet } from "@/components/cart/cart-sheet"
import { AnnouncementBar } from "@/components/layout/announcement-bar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Button } from "@/components/ui/button"
import { mainNav, siteConfig } from "@/config/site"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />
      <div className="border-b border-border/70 bg-paper/90 backdrop-blur-md supports-backdrop-filter:bg-paper/80">
        <div className="container-page flex h-16 items-center gap-2 md:h-20">
          <div className="flex flex-1 items-center gap-1 lg:flex-none">
            <MobileNav />
            <Logo className="hidden sm:inline-flex lg:mr-10" />
          </div>

          <Logo className="sm:hidden" />

          <nav aria-label="Основна навігація" className="hidden flex-1 lg:block">
            <ul className="flex items-center gap-8">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[0.9375rem] text-ink-soft transition-colors hover:text-ink"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-1 items-center justify-end gap-1 lg:flex-none">
            <a
              href={siteConfig.contacts.phoneHref}
              className="mr-4 hidden text-[0.9375rem] text-ink-soft transition-colors hover:text-ink xl:inline"
            >
              {siteConfig.contacts.phone}
            </a>
            <Button asChild variant="ghost" size="icon">
              <Link href="/bouquets#catalog-search" aria-label="Пошук у каталозі">
                <SearchIcon className="size-5" />
              </Link>
            </Button>
            <CartButton />
            <CartSheet />
          </div>
        </div>
      </div>
    </header>
  )
}
