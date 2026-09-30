"use client"

import { HeartIcon } from "lucide-react"

import { toggleFavorite, useIsFavorite } from "@/lib/stores/favorites"
import { cn } from "@/lib/utils"

type FavoriteButtonProps = {
  slug: string
  name: string
  variant?: "overlay" | "outline"
  className?: string
}

export function FavoriteButton({ slug, name, variant = "overlay", className }: FavoriteButtonProps) {
  const active = useIsFavorite(slug)
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Прибрати «${name}» з обраного` : `Додати «${name}» в обране`}
      onClick={() => toggleFavorite(slug)}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full transition-colors",
        variant === "overlay"
          ? "size-10 bg-paper/85 text-ink backdrop-blur-sm hover:bg-paper"
          : "size-12 border border-input bg-transparent text-ink hover:bg-linen",
        className
      )}
    >
      <HeartIcon
        className={cn("size-[1.15rem] transition-transform", active && "scale-110 fill-rose text-rose")}
        strokeWidth={1.6}
      />
    </button>
  )
}
