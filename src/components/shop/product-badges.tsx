import { discountPercent } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import type { ProductSummary } from "@/types/catalog"

type Badge = { text: string; tone: "sale" | "new" | "popular" | "low" | "muted" }

export function getBadges(product: ProductSummary): Badge[] {
  const badges: Badge[] = []
  const discount = discountPercent(product)
  if (product.availability === "out_of_stock") badges.push({ text: "Немає в наявності", tone: "muted" })
  if (product.availability === "low_stock") badges.push({ text: "Закінчується", tone: "low" })
  if (discount) badges.push({ text: `−${discount}%`, tone: "sale" })
  // Promotional badges are noise on something that cannot be bought
  if (product.availability !== "out_of_stock") {
    if (product.isNew) badges.push({ text: "Новинка", tone: "new" })
    if (product.isPopular) badges.push({ text: "Популярне", tone: "popular" })
  }
  return badges
}

const toneClass: Record<Badge["tone"], string> = {
  sale: "bg-rose text-paper",
  new: "bg-paper/95 text-ink",
  popular: "bg-moss text-paper",
  low: "bg-paper/95 text-rose",
  muted: "bg-ink/75 text-paper",
}

export function ProductBadges({ product, className }: { product: ProductSummary; className?: string }) {
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
