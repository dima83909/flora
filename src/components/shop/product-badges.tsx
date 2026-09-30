import { discountPercent } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import type { Product } from "@/types/catalog"

type Badge = { text: string; tone: "sale" | "new" | "popular" | "muted" }

export function getBadges(product: Product): Badge[] {
  const badges: Badge[] = []
  const discount = discountPercent(product)
  if (product.availability === "out_of_stock") badges.push({ text: "Немає в наявності", tone: "muted" })
  if (discount) badges.push({ text: `−${discount}%`, tone: "sale" })
  if (product.label === "new") badges.push({ text: "Новинка", tone: "new" })
  if (product.label === "popular") badges.push({ text: "Популярне", tone: "popular" })
  return badges
}

const toneClass: Record<Badge["tone"], string> = {
  sale: "bg-rose text-paper",
  new: "bg-paper/95 text-ink",
  popular: "bg-moss text-paper",
  muted: "bg-ink/75 text-paper",
}

export function ProductBadges({ product, className }: { product: Product; className?: string }) {
  const badges = getBadges(product)
  if (!badges.length) return null
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Позначки товару">
      {badges.map((badge) => (
        <li
          key={badge.text}
          className={cn("rounded-full px-2.5 py-1 text-[0.75rem] leading-none font-medium", toneClass[badge.tone])}
        >
          {badge.text}
        </li>
      ))}
    </ul>
  )
}
