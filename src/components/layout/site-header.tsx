import { Logo } from "@/components/brand/logo"
import { CartButton, CartSheet } from "@/components/cart/cart-sheet"
import { AnnouncementBar } from "@/components/layout/announcement-bar"
import { HeaderFavorites } from "@/components/layout/header-favorites"
import { MainNav } from "@/components/layout/main-nav"
import { MobileNav } from "@/components/layout/mobile-nav"
import { HeaderSearch } from "@/components/search/header-search"
import { siteConfig } from "@/config/site"

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
            <MainNav variant="desktop" />
          </nav>

          <div className="flex flex-1 items-center justify-end sm:gap-1 lg:flex-none">
            <a
              href={siteConfig.contacts.phoneHref}
              className="mr-4 hidden text-[0.9375rem] text-ink-soft transition-colors hover:text-ink xl:inline"
            >
              {siteConfig.contacts.phone}
            </a>
            <HeaderSearch />
            <HeaderFavorites />
            <CartButton />
            <CartSheet />
          </div>
        </div>
      </div>
    </header>
  )
}
