"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const items = [
  { href: "/admin/orders", label: "Замовлення" },
  { href: "/admin/products", label: "Товари" },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Розділи адмін-панелі" className="flex items-center gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm transition-colors any-pointer-coarse:min-h-11",
              active ? "bg-linen font-medium text-ink" : "text-ink-soft hover:text-ink"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
