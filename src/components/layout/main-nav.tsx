"use client"

import { Suspense, useMemo } from "react"
import Link from "next/link"

import { useCatalog } from "@/components/catalog/catalog-provider"
import { buildMainNav, type NavItem } from "@/config/site"
import { useActiveNavHref } from "@/lib/use-active-nav"
import { cn } from "@/lib/utils"

type NavListProps = {
  items: NavItem[]
  activeHref: string | null
  variant: "desktop" | "mobile"
  onNavigate?: () => void
}

function NavList({ items, activeHref, variant, onNavigate }: NavListProps) {
  return (
    <ul className={variant === "desktop" ? "flex items-center gap-7 xl:gap-8" : undefined}>
      {items.map((item) => {
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
  return <NavList activeHref={useActiveNavHref(props.items)} {...props} />
}

type MainNavProps = Omit<NavListProps, "activeHref" | "items">

/** Active state depends on search params; the fallback keeps static pages prerenderable */
export function MainNav(props: MainNavProps) {
  const { categories } = useCatalog()
  const items = useMemo(() => buildMainNav(categories), [categories])
  return (
    <Suspense fallback={<NavList items={items} activeHref={null} {...props} />}>
      <ActiveNavList items={items} {...props} />
    </Suspense>
  )
}
