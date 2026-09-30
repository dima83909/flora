"use client"

import { MinusIcon, PlusIcon } from "lucide-react"

import { MAX_QUANTITY } from "@/lib/stores/cart"
import { cn } from "@/lib/utils"

type QuantityStepperProps = {
  value: number
  onChange: (value: number) => void
  label: string
  size?: "sm" | "lg"
  className?: string
}

export function QuantityStepper({ value, onChange, label, size = "lg", className }: QuantityStepperProps) {
  const button = cn(
    "flex items-center justify-center rounded-full text-ink transition-colors hover:bg-linen disabled:pointer-events-none disabled:opacity-35",
    size === "lg" ? "size-11" : "size-8"
  )
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center rounded-full border border-input bg-card", size === "lg" ? "h-12 p-0.5" : "h-9 p-0.5", className)}
    >
      <button type="button" className={button} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Зменшити кількість">
        <MinusIcon className={size === "lg" ? "size-4" : "size-3.5"} />
      </button>
      <output aria-live="polite" className={cn("text-center font-medium tabular-nums", size === "lg" ? "w-8 text-base" : "w-6 text-sm")}>
        {value}
      </output>
      <button type="button" className={button} onClick={() => onChange(value + 1)} disabled={value >= MAX_QUANTITY} aria-label="Збільшити кількість">
        <PlusIcon className={size === "lg" ? "size-4" : "size-3.5"} />
      </button>
    </div>
  )
}
