"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HeartIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useFavorites } from "@/lib/stores/favorites"

export function HeaderFavorites() {
  const count = useFavorites().length
  const active = usePathname() === "/favorites"
  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link
        href="/favorites"
        aria-label={count ? `Обране, товарів: ${count}` : "Обране"}
        aria-current={active ? "page" : undefined}
      >
        <HeartIcon className="size-5" fill={active ? "currentColor" : "none"} />
        {count ? (
          <span className="absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[0.625rem] leading-none font-semibold text-paper tabular-nums">
            {count}
          </span>
        ) : null}
      </Link>
    </Button>
  )
}
