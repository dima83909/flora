"use client"

import { Suspense } from "react"
import Link from "next/link"

import { mainNav } from "@/config/site"
import { useActiveNavHref } from "@/lib/use-active-nav"
import { cn } from "@/lib/utils"

type NavListProps = {
  activeHref: string | null
  variant: "desktop" | "mobile"
  onNavigate?: () => void
}

function NavList({ activeHref, variant, onNavigate }: NavListProps) {
  return (
    <ul className={variant === "desktop" ? "flex items-center gap-7 xl:gap-8" : undefined}>
      {mainNav.map((item) => {
        const active = item.href === activeHref
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                variant === "desktop"
                  ? "relative py-2 text-[0.9375rem] whitespace-nowrap transition-colors hover:text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-ink after:transition-transform"
                  : "flex items-center justify-between border-b border-border/70 py-4 font-heading text-2xl font-light transition-colors hover:text-stem",
                variant === "desktop" && (active ? "text-ink after:scale-x-100" : "text-ink-soft after:scale-x-0"),
                variant === "mobile" && (active ? "text-stem" : "text-ink")
              )}
            >
              {item.title}
              {variant === "mobile" && active ? (
                <span aria-hidden className="size-1.5 rounded-full bg-rose" />
              ) : null}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function ActiveNavList(props: Omit<NavListProps, "activeHref">) {
  return <NavList activeHref={useActiveNavHref()} {...props} />
}

/** Active state depends on search params; the fallback keeps static pages prerenderable */
export function MainNav(props: Omit<NavListProps, "activeHref">) {
  return (
    <Suspense fallback={<NavList activeHref={null} {...props} />}>
      <ActiveNavList {...props} />
    </Suspense>
  )
}
