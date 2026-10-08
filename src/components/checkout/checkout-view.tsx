"use client"

import { useId, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SendIcon } from "lucide-react"

import { placeOrder } from "@/app/(storefront)/checkout/actions"
import { GiftArt } from "@/components/brand/gift-art"
import { useCatalog } from "@/components/catalog/catalog-provider"
import { ProductImage } from "@/components/shop/product-image"
import { Button } from "@/components/ui/button"
import { isPurchasable, pluralize } from "@/lib/catalog"
import { customerFieldErrors, customerSchema, ORDER_LIMITS, type CustomerField } from "@/lib/order-schema"
import { cartActions, useCartLines } from "@/lib/stores/cart"
import { useHydrated } from "@/lib/use-hydrated"
import { cn, formatPrice } from "@/lib/utils"
import type { UnavailableItem } from "@/server/orders/create-order"
import type { ProductSummary } from "@/types/catalog"

type Values = Record<CustomerField, string>
type Line = { slug: string; quantity: number; product?: ProductSummary }

const MANAGER_NOTE =
  "Після оформлення менеджер зв'яжеться з вами в Telegram, щоб уточнити деталі доставки та оплати."

export function CheckoutView() {
  const hydrated = useHydrated()
  const router = useRouter()
  const cartLines = useCartLines()
  const { getProduct } = useCatalog()

  const [values, setValues] = useState<Values>({ name: "", phone: "", city: "", comment: "" })
  // Honeypot: invisible to people, so it stays empty unless a bot fills every input
  const [website, setWebsite] = useState("")
  const [errors, setErrors] = useState<Partial<Record<CustomerField, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState<UnavailableItem[]>([])
  const [pending, startTransition] = useTransition()
  // Keeps the summary on screen while redirecting, after the cart has been cleared
  const [placedLines, setPlacedLines] = useState<Line[] | null>(null)
  const fieldRefs = useRef<Partial<Record<CustomerField, HTMLInputElement | HTMLTextAreaElement | null>>>({})

  const lines: Line[] = placedLines ?? cartLines.map((line) => ({ ...line, product: getProduct(line.slug) }))
  const orderable = lines.filter((line) => line.product && isPurchasable(line.product.availability))
  const blocked = lines.filter((line) => !orderable.includes(line))
  // Preview only: the server recalculates the total from database prices
  const subtotal = orderable.reduce((sum, line) => sum + line.product!.price * line.quantity, 0)
  const count = orderable.reduce((sum, line) => sum + line.quantity, 0)

  function update(field: CustomerField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function focusFirstError(fieldErrors: Partial<Record<CustomerField, string>>) {
    const first = (["name", "phone", "city", "comment"] as const).find((field) => fieldErrors[field])
    if (first) fieldRefs.current[first]?.focus()
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setFormError(null)

    const parsed = customerSchema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors = customerFieldErrors(parsed.error)
      setErrors(fieldErrors)
      focusFirstError(fieldErrors)
      return
    }
    if (blocked.length) {
      setFormError("Приберіть з кошика товари, яких зараз немає в наявності.")
      return
    }

    const snapshot = lines
    startTransition(async () => {
      try {
        const result = await placeOrder({
          customer: values,
          website,
          items: snapshot.map(({ slug, quantity }) => ({ slug, quantity })),
        })
        if (result.ok) {
          setPlacedLines(snapshot)
          cartActions.clear()
          router.replace(`/order-success/${result.number}`)
          return
        }
        setFormError(result.message)
        if (result.reason === "invalid") {
          setErrors(result.fieldErrors)
          focusFirstError(result.fieldErrors)
        }
        if (result.reason === "unavailable") setUnavailable(result.items)
      } catch {
        // Network failure: the cart stays as it was
        setFormError("Не вдалося з'єднатися із сервером. Перевірте інтернет і спробуйте ще раз.")
      }
    })
  }

  if (!hydrated) return <div aria-hidden className="mt-10 h-[60vh]" />

  if (!lines.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center md:py-20">
        <div className="arch aspect-3/4 w-32 overflow-hidden md:w-40">
          <GiftArt variant="vase" />
        </div>
        <h2 className="mt-8 text-subtitle font-light text-ink">Кошик порожній</h2>
        <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-soft">
          Додайте букет з каталогу, і тут можна буде оформити замовлення.
        </p>
        <Button asChild size="lg" className="mt-7">
          <Link href="/bouquets">Перейти до каталогу</Link>
        </Button>
      </div>
    )
  }

  const problemBySlug = new Map(unavailable.map((item) => [item.slug, item]))

  return (
    <div className="mt-8 grid gap-10 md:mt-12 lg:grid-cols-12 lg:gap-12 xl:gap-16">
      {/* Summary first in reading order; sits in the right column on desktop */}
      <section
        aria-labelledby="summary-title"
        className="lg:col-span-5 lg:col-start-8 lg:row-start-1"
      >
        <div className="rounded-2xl bg-linen/70 p-5 md:p-7 lg:sticky lg:top-32">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="summary-title" className="text-xl font-normal text-ink">
              Ваше замовлення
            </h2>
            {placedLines ? null : (
              <button
                type="button"
                onClick={() => cartActions.setOpen(true)}
                className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
              >
                Змінити
              </button>
            )}
          </div>

          <ul className="mt-5 divide-y divide-border/80">
            {lines.map(({ slug, quantity, product }) => {
              const problem = problemBySlug.get(slug)
              const unavailableNow = !product || !isPurchasable(product.availability) || problem
              return (
                <li key={slug} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="aspect-4/5 w-16 shrink-0 overflow-hidden rounded-xl bg-paper">
                    {product ? <ProductImage visual={product.visual} src={product.images?.[0]} sizes="64px" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-[1.0625rem] leading-snug text-ink">
                      {product?.name ?? "Товар більше недоступний"}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft tabular-nums">
                      {quantity} × {product ? formatPrice(product.price) : "—"}
                    </p>
                    {unavailableNow ? (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="text-rose">Зараз немає в наявності</span>
                        <button
                          type="button"
                          className="text-ink underline underline-offset-4"
                          onClick={() => {
                            cartActions.remove(slug)
                            setUnavailable((items) => items.filter((item) => item.slug !== slug))
                          }}
                        >
                          Прибрати з кошика
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-[0.9375rem] font-medium text-ink tabular-nums">
                    {product ? formatPrice(product.price * quantity) : ""}
                  </p>
                </li>
              )
            })}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-border/80 pt-5 text-[0.9375rem]">
            <div className="flex justify-between gap-4 text-ink-soft">
              <dt>Доставка</dt>
              <dd className="text-right">вартість уточнить менеджер</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink">
                Разом за {count} {pluralize(count, ["товар", "товари", "товарів"])}
              </dt>
              <dd className="text-xl font-medium text-ink tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <form
        noValidate
        onSubmit={onSubmit}
        aria-labelledby="contact-title"
        className="lg:col-span-7 lg:col-start-1 lg:row-start-1"
      >
        <h2 id="contact-title" className="text-xl font-normal text-ink">
          Контакти
        </h2>
        <p className="mt-2 max-w-lg text-[0.9375rem] leading-relaxed text-ink-soft">
          Доставляємо по всій Україні цілодобово 24/7. Адресу, дату й час доставки менеджер уточнить у Telegram,
          тож зараз потрібні лише ім&apos;я, номер телефону й місто.
        </p>

        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Не заповнюйте це поле
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            name="name"
            label="Ім'я"
            required
            error={errors.name}
            className="sm:col-span-2"
            render={(props) => (
              <input
                {...props}
                ref={(node) => {
                  fieldRefs.current.name = node
                }}
                type="text"
                autoComplete="name"
                maxLength={ORDER_LIMITS.nameMax}
                value={values.name}
                onChange={(e) => update("name", e.target.value)}
              />
            )}
          />
          <Field
            name="phone"
            label="Телефон"
            required
            hint="Номер, прив'язаний до вашого Telegram, наприклад 050 123 45 67"
            error={errors.phone}
            render={(props) => (
              <input
                {...props}
                ref={(node) => {
                  fieldRefs.current.phone = node
                }}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={20}
                value={values.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            )}
          />
          <Field
            name="city"
            label="Місто"
            required
            error={errors.city}
            render={(props) => (
              <input
                {...props}
                ref={(node) => {
                  fieldRefs.current.city = node
                }}
                type="text"
                autoComplete="address-level2"
                placeholder="Введіть місто"
                maxLength={ORDER_LIMITS.cityMax}
                value={values.city}
                onChange={(e) => update("city", e.target.value)}
              />
            )}
          />
          <Field
            name="comment"
            label="Коментар"
            hint={`Побажання до букета чи інші деталі. ${values.comment.length}/${ORDER_LIMITS.commentMax}`}
            error={errors.comment}
            className="sm:col-span-2"
            render={(props) => (
              <textarea
                {...props}
                ref={(node) => {
                  fieldRefs.current.comment = node
                }}
                rows={4}
                maxLength={ORDER_LIMITS.commentMax}
                value={values.comment}
                onChange={(e) => update("comment", e.target.value)}
                className={cn(props.className, "h-auto resize-y py-3 leading-relaxed")}
              />
            )}
          />
        </div>

        <p className="mt-7 flex gap-3 rounded-2xl bg-petal/70 px-4 py-4 text-[0.9375rem] leading-relaxed text-ink md:px-5">
          <SendIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-rose" strokeWidth={1.6} />
          {MANAGER_NOTE}
        </p>

        <div aria-live="assertive" className="empty:hidden mt-5 text-[0.9375rem] text-destructive">
          {formError}
        </div>

        <Button type="submit" size="lg" disabled={pending || Boolean(placedLines)} className="mt-6 w-full sm:w-auto sm:min-w-56">
          {pending || placedLines ? "Оформлюємо…" : "Замовити"}
        </Button>
      </form>
    </div>
  )
}

type FieldProps = {
  name: CustomerField
  label: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  render: (props: {
    id: string
    name: string
    required?: boolean
    "aria-invalid"?: boolean
    "aria-describedby"?: string
    className: string
  }) => React.ReactNode
}

function Field({ name, label, required, hint, error, className, render }: FieldProps) {
  const id = useId()
  // Points at whichever message is visible: the error replaces the hint
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <span aria-hidden className="text-rose">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {render({
        id,
        name,
        required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        className: cn(
          "mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 text-base text-ink outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-stem focus-visible:ring-3 focus-visible:ring-stem/20",
          error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15"
        ),
      })}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
