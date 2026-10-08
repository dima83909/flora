"use client"

import Link from "next/link"
import { ShoppingBagIcon, XIcon } from "lucide-react"

import { useCatalog } from "@/components/catalog/catalog-provider"
import { Price } from "@/components/shop/price"
import { ProductImage } from "@/components/shop/product-image"
import { QuantityStepper } from "@/components/shop/quantity-stepper"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { pluralize } from "@/lib/catalog"
import { cartActions, useCartLines, useCartOpen } from "@/lib/stores/cart"
import { formatPrice } from "@/lib/utils"

/**
 * Cart lines matched against the published catalogue. Lines whose product is hidden or
 * deleted stay in storage (the product may come back) but are not counted or priced.
 */
function useCartItems() {
  const lines = useCartLines()
  const { getProduct } = useCatalog()
  const items = lines.flatMap((line) => {
    const product = getProduct(line.slug)
    return product ? [{ ...line, product }] : []
  })
  const unavailable = lines.filter((line) => !getProduct(line.slug)).map((line) => line.slug)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  return { items, unavailable, count }
}

export function CartButton() {
  const { count } = useCartItems()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={count ? `Кошик, товарів: ${count}` : "Кошик порожній"}
      onClick={() => cartActions.setOpen(true)}
    >
      <ShoppingBagIcon className="size-5" />
      {count ? (
        <span className="absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[0.625rem] leading-none font-semibold text-paper tabular-nums">
          {count}
        </span>
      ) : null}
    </Button>
  )
}

export function CartSheet() {
  const open = useCartOpen()
  const { items, unavailable, count } = useCartItems()
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <Sheet open={open} onOpenChange={cartActions.setOpen}>
      <SheetContent side="right" className="w-full gap-0 bg-paper p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="font-heading text-2xl font-light">Кошик</SheetTitle>
          <SheetDescription>
            {count ? `${count} ${pluralize(count, ["товар", "товари", "товарів"])}` : "Тут поки порожньо"}
          </SheetDescription>
        </SheetHeader>

        {unavailable.length ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-petal/60 px-6 py-3 text-sm text-ink">
            <span>
              {unavailable.length === 1
                ? "Один товар із кошика більше недоступний."
                : "Кілька товарів із кошика більше недоступні."}
            </span>
            <button
              type="button"
              onClick={() => unavailable.forEach((slug) => cartActions.remove(slug))}
              className="inline-flex items-center underline underline-offset-4 hover:text-stem any-pointer-coarse:min-h-11"
            >
              Прибрати
            </button>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-5 px-6">
            <p className="max-w-xs text-[0.9375rem] leading-relaxed text-ink-soft">
              Додайте букет з каталогу, і він з’явиться тут. Кошик зберігається на цьому пристрої.
            </p>
            <Button asChild variant="outline" className="bg-transparent" onClick={() => cartActions.setOpen(false)}>
              <Link href="/bouquets">Перейти до каталогу</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-6">
              {items.map(({ product, quantity }) => (
                <li key={product.slug} className="flex gap-4 py-5">
                  <Link
                    href={`/bouquets/${product.slug}`}
                    onClick={() => cartActions.setOpen(false)}
                    className="block aspect-4/5 w-20 shrink-0 overflow-hidden rounded-xl"
                    tabIndex={-1}
                    aria-hidden
                  >
                    <ProductImage visual={product.visual} src={product.images?.[0]} sizes="80px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/bouquets/${product.slug}`}
                        onClick={() => cartActions.setOpen(false)}
                        className="font-heading text-[1.0625rem] leading-snug text-ink hover:text-stem"
                      >
                        {product.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => cartActions.remove(product.slug)}
                        aria-label={`Видалити «${product.name}» з кошика`}
                        className="relative -mt-1 -mr-2 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground after:absolute after:-inset-1.5 hover:bg-linen hover:text-ink"
                      >
                        <XIcon className="size-4" />
                      </button>
                    </div>
                    <Price price={product.price} oldPrice={product.oldPrice} className="mt-1" />
                    <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                      <QuantityStepper
                        size="sm"
                        value={quantity}
                        label={`Кількість «${product.name}»`}
                        onChange={(value) => cartActions.setQuantity(product.slug, value)}
                      />
                      <span className="text-sm font-medium text-ink tabular-nums">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <SheetFooter className="gap-4 border-t bg-linen/50 px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[0.9375rem] text-ink">Разом без доставки</span>
                <span className="text-xl font-medium text-ink tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link href="/checkout" onClick={() => cartActions.setOpen(false)}>
                  Оформити замовлення
                </Link>
              </Button>
              <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                Онлайн-оплати немає: після оформлення менеджер напише вам у Telegram і узгодить доставку та оплату.
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
