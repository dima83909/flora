"use client"

import { useState } from "react"
import { MenuIcon } from "lucide-react"

import { Logo } from "@/components/brand/logo"
import { MainNav } from "@/components/layout/main-nav"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { siteConfig } from "@/config/site"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Відкрити меню">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[88%] max-w-sm gap-0 bg-paper p-0">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="sr-only">Меню</SheetTitle>
          <SheetDescription className="sr-only">Навігація сайтом</SheetDescription>
          {/* Link clicks bubble here, so the menu closes when going home */}
          <div className="self-start" onClick={() => setOpen(false)}>
            <Logo />
          </div>
        </SheetHeader>
        <nav aria-label="Мобільна навігація" className="flex-1 overflow-y-auto px-6 py-4">
          <MainNav variant="mobile" onNavigate={() => setOpen(false)} />
        </nav>
        {siteConfig.contacts.openingHours ? (
          <p className="border-t bg-linen/60 px-6 py-5 text-sm text-ink-soft">
            {siteConfig.contacts.openingHours}
          </p>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
