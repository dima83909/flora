"use client"

import Link from "next/link"
import { useState } from "react"
import { MenuIcon } from "lucide-react"

import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { mainNav, siteConfig } from "@/config/site"

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
          <SheetTitle asChild>
            <div>
              <Logo />
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">Навігація сайтом</SheetDescription>
        </SheetHeader>
        <nav aria-label="Мобільна навігація" className="flex-1 overflow-y-auto px-6 py-4">
          <ul>
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-border/70 py-4 font-heading text-2xl font-light text-ink transition-colors hover:text-stem"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-1 border-t bg-linen/60 px-6 py-5 text-sm text-ink-soft">
          <a href={siteConfig.contacts.phoneHref} className="block font-medium text-ink">
            {siteConfig.contacts.phone}
          </a>
          <p>{siteConfig.contacts.hours}</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
