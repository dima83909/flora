"use client"

import { MAX_QUANTITY } from "@/lib/cart-limits"
import { createStore } from "@/lib/stores/create-store"

export type CartLine = { slug: string; quantity: number }

export { MAX_QUANTITY }

const clamp = (n: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.round(n)))

const cartStore = createStore<CartLine[]>([], {
  storageKey: "flora.cart.v1",
  parse: (raw) =>
    Array.isArray(raw)
      ? raw
          .filter((l): l is CartLine => typeof l?.slug === "string" && typeof l?.quantity === "number")
          .map((l) => ({ slug: l.slug, quantity: clamp(l.quantity) }))
      : [],
})

const cartUiStore = createStore({ open: false })

export const cartActions = {
  add(slug: string, quantity = 1) {
    cartStore.setState((lines) => {
      const existing = lines.find((l) => l.slug === slug)
      if (!existing) return [...lines, { slug, quantity: clamp(quantity) }]
      return lines.map((l) => (l.slug === slug ? { ...l, quantity: clamp(l.quantity + quantity) } : l))
    })
  },
  setQuantity(slug: string, quantity: number) {
    cartStore.setState((lines) => lines.map((l) => (l.slug === slug ? { ...l, quantity: clamp(quantity) } : l)))
  },
  remove(slug: string) {
    cartStore.setState((lines) => lines.filter((l) => l.slug !== slug))
  },
  /** Empties the cart, e.g. after an order is placed */
  clear() {
    cartStore.setState(() => [])
  },
  setOpen(open: boolean) {
    cartUiStore.setState(() => ({ open }))
  },
}

export function useCartLines() {
  return cartStore.useStore((lines) => lines)
}

export function useCartCount() {
  return cartStore.useStore((lines) => lines.reduce((sum, l) => sum + l.quantity, 0))
}

export function useCartOpen() {
  return cartUiStore.useStore((s) => s.open)
}
