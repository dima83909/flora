"use client"

import { useEffect, useRef, useState } from "react"
import { CheckIcon, ShoppingBagIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { isPurchasable } from "@/lib/catalog"
import { cartActions } from "@/lib/stores/cart"
import { cn } from "@/lib/utils"
import type { Product } from "@/types/catalog"

type AddToCartButtonProps = {
  product: Pick<Product, "slug" | "name" | "availability">
  quantity?: number
  variant?: "icon" | "full"
  className?: string
}

/**
 * Adds to the client-side cart and confirms the action in place for a moment.
 * While the confirmation is shown, the same control opens the cart instead of adding again.
 */
export function AddToCartButton({ product, quantity = 1, variant = "full", className }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const available = isPurchasable(product.availability)

  useEffect(() => () => clearTimeout(timer.current), [])

  function handleClick() {
    if (added) {
      cartActions.setOpen(true)
      return
    }
    cartActions.add(product.slug, quantity)
    setAdded(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 2200)
  }

  const status = (
    <span aria-live="polite" className="sr-only">
      {added ? `«${product.name}» додано до кошика` : ""}
    </span>
  )

  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          disabled={!available}
          aria-label={
            !available
              ? `«${product.name}» немає в наявності`
              : added
                ? "Додано до кошика. Відкрити кошик"
                : `Додати «${product.name}» до кошика`
          }
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full border border-input any-pointer-coarse:size-11 text-ink transition-colors hover:border-moss hover:bg-moss hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stem disabled:pointer-events-none disabled:opacity-35",
            added && "border-moss bg-moss text-paper",
            className
          )}
        >
          {added ? <CheckIcon className="size-4" /> : <ShoppingBagIcon className="size-4" strokeWidth={1.7} />}
        </button>
        {status}
      </>
    )
  }

  return (
    <>
      <Button size="lg" onClick={handleClick} disabled={!available} className={cn("w-full", className)}>
        {added ? <CheckIcon data-icon="inline-start" /> : <ShoppingBagIcon data-icon="inline-start" />}
        {!available ? "Немає в наявності" : added ? "Додано до кошика" : "Додати в кошик"}
        {added ? <span className="sr-only">. Відкрити кошик</span> : null}
      </Button>
      {status}
    </>
  )
}
