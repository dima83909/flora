import { ORDER_STATUS_LABELS, type OrderStatusValue } from "@/lib/order-status"
import { cn } from "@/lib/utils"

const styles: Record<OrderStatusValue, string> = {
  NEW: "bg-rose text-paper",
  CONTACTED: "bg-[#f1dfb8] text-[#5c4210]",
  CONFIRMED: "bg-sage text-moss",
  COMPLETED: "bg-moss text-paper",
  CANCELLED: "bg-linen text-muted-foreground",
}

export function StatusBadge({ status, className }: { status: OrderStatusValue; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        styles[status],
        className
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}
