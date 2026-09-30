"use client"

import { useEffect, useRef, useState } from "react"

import { AddToCartButton } from "@/components/shop/add-to-cart-button"
import { FavoriteButton } from "@/components/shop/favorite-button"
import { Price } from "@/components/shop/price"
import { QuantityStepper } from "@/components/shop/quantity-stepper"
import { isPurchasable } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import type { Product } from "@/types/catalog"

type PurchasePanelProps = {
  product: Pick<Product, "slug" | "name" | "price" | "oldPrice" | "availability">
}

export function PurchasePanel({ product }: PurchasePanelProps) {
  const [quantity, setQuantity] = useState(1)
  const available = isPurchasable(product.availability)

  // Mobile: once the main button scrolls above the viewport, a compact bar keeps it within reach
  const anchorRef = useRef<HTMLDivElement>(null)
  const [showBar, setShowBar] = useState(false)
  useEffect(() => {
    const node = anchorRef.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={anchorRef} className="flex flex-wrap items-center gap-3">
        {available ? (
          <QuantityStepper value={quantity} onChange={setQuantity} label="Кількість" />
        ) : null}
        <div className="order-last basis-full sm:order-none sm:min-w-44 sm:flex-1 sm:basis-auto">
          <AddToCartButton product={product} quantity={quantity} />
        </div>
        <FavoriteButton slug={product.slug} name={product.name} variant="outline" className="ml-auto sm:ml-0" />
      </div>

      <div
        data-sticky-cta
        aria-hidden={!showBar}
        inert={!showBar}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-paper/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 ease-petal lg:hidden",
          showBar ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-[0.9375rem] text-ink">{product.name}</p>
            <Price price={product.price} oldPrice={product.oldPrice} />
          </div>
          <div className="w-44 shrink-0">
            <AddToCartButton product={product} quantity={quantity} className="h-11" />
          </div>
        </div>
      </div>
    </>
  )
}
