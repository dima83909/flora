import { PRODUCT_AVAILABILITY_LABELS, type ProductAvailabilityValue } from "@/lib/product-schema"
import { cn } from "@/lib/utils"

const styles: Record<ProductAvailabilityValue, string> = {
  IN_STOCK: "bg-sage text-moss",
  LOW_STOCK: "bg-[#f1dfb8] text-[#5c4210]",
  PREORDER: "bg-linen text-ink-soft",
  OUT_OF_STOCK: "bg-ink/75 text-paper",
}

export function AvailabilityBadge({
  availability,
  className,
}: {
  availability: ProductAvailabilityValue
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        styles[availability],
        className
      )}
    >
      {PRODUCT_AVAILABILITY_LABELS[availability]}
    </span>
  )
}
