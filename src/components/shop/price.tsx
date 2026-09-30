import { formatPrice, cn } from "@/lib/utils"
import type { Product } from "@/types/catalog"

type PriceProps = Pick<Product, "price" | "oldPrice"> & {
  className?: string
  size?: "sm" | "lg"
}

export function Price({ price, oldPrice, className, size = "sm" }: PriceProps) {
  const onSale = oldPrice !== undefined && oldPrice > price
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 tabular-nums", className)}>
      <span
        className={cn(
          "font-medium",
          size === "lg" ? "text-2xl md:text-[1.75rem]" : "text-[0.9375rem]",
          onSale ? "text-rose" : "text-ink"
        )}
      >
        {onSale ? <span className="sr-only">Ціна зі знижкою: </span> : null}
        {formatPrice(price)}
      </span>
      {onSale ? (
        <s className={cn("text-muted-foreground", size === "lg" ? "text-base" : "text-[0.8125rem]")}>
          <span className="sr-only">Стара ціна: </span>
          {formatPrice(oldPrice)}
        </s>
      ) : null}
    </p>
  )
}
