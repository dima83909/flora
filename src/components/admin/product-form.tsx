"use client"

import Link from "next/link"
import { startTransition, useActionState, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { plural } from "@/lib/admin-format"
import {
  formDiscountPercent,
  HOMEPAGE_FEATURED_LIMIT,
  PRODUCT_AVAILABILITIES,
  PRODUCT_AVAILABILITY_LABELS,
  PRODUCT_LIMITS,
  productFieldErrors,
  productFormSchema,
  type ProductField,
  type ProductFormInput,
} from "@/lib/product-schema"
import { cn } from "@/lib/utils"
import { saveProduct, type ProductFormState } from "@/app/admin/(panel)/products/actions"

type Values = Required<ProductFormInput>
type Errors = Partial<Record<ProductField, string>>

type ProductFormProps = {
  /** Missing for a new product */
  product?: { id: string; updatedAt: string }
  initialValues: Values
  categories: { id: string; name: string; isActive: boolean }[]
  /** Other published products flagged for the homepage */
  featuredElsewhere: number
  /** Cards at the top of the main column, outside the form (photos are saved on their own) */
  media?: React.ReactNode
  /** Extra cards at the end of the side column, outside the form (e.g. deletion, which is a form of its own) */
  aside?: React.ReactNode
}

const AVAILABILITY_HINTS: Record<(typeof PRODUCT_AVAILABILITIES)[number], string> = {
  IN_STOCK: "Можна замовити, збираємо з квітів у майстерні",
  LOW_STOCK: "Можна замовити, на сайті позначка «Закінчується»",
  PREORDER: "Квіти замовляємо під замовлення, потрібен строк",
  OUT_OF_STOCK: "Видно на сайті, але замовити не можна",
}

const textareaClass =
  "block w-full resize-y rounded-lg border border-input bg-card px-3 py-2.5 text-[0.9375rem] leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"

const inputClass = "h-10 bg-card text-[0.9375rem]"

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="font-sans text-base font-medium text-ink">{title}</h2>
      {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function Field({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: ProductField
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={`product-${name}`} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`product-${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`product-${name}-hint`} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function Check({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint: string
}) {
  return (
    <label className="flex cursor-pointer gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-moss"
      />
      <span>
        <span className="block text-[0.9375rem] text-ink">{label}</span>
        <span className="block text-xs leading-relaxed text-muted-foreground">{hint}</span>
      </span>
    </label>
  )
}

/** Field order, so a failed submit can focus the first problem */
const FIELD_ORDER: ProductField[] = [
  "name",
  "categoryId",
  "composition",
  "description",
  "stems",
  "careInstructions",
  "size",
  "price",
  "oldPrice",
  "availability",
  "leadTimeDays",
]

/**
 * The fields are controlled, so the <form> only wraps the save bar: that keeps other
 * forms (deletion) out of it, and pressing Enter in a field does not save by accident.
 */
export function ProductForm({ product, initialValues, categories, featuredElsewhere, media, aside }: ProductFormProps) {
  const [state, dispatch, pending] = useActionState(saveProduct, null)
  const [values, setValues] = useState(initialValues)
  const [saved, setSaved] = useState(initialValues)
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(initialValues)

  // Take over what the server said about the last submit: its field errors, or the saved values
  const [handledState, setHandledState] = useState<ProductFormState>(null)
  if (state !== handledState) {
    setHandledState(state)
    setErrors(state?.fieldErrors ?? {})
    if (state?.ok) setSaved(submitted)
  }

  const dirty = JSON.stringify(values) !== JSON.stringify(saved)
  // The server's verdict on the last submit stays up only until the form is edited again
  const showServerError = Boolean(state && !state.ok) && JSON.stringify(values) === JSON.stringify(submitted)

  // Leaving the page with unsaved changes asks first (a redirect after creating does not,
  // nor does reloading on purpose to get the newer version)
  const discarding = useRef(false)
  useEffect(() => {
    if (!dirty || pending) return
    const warn = (event: BeforeUnloadEvent) => {
      if (!discarding.current) event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty, pending])

  // A failed submit moves focus to the first field with a problem
  const focusNext = useRef(false)
  useEffect(() => {
    if (!focusNext.current) return
    focusNext.current = false
    const field = FIELD_ORDER.find((name) => errors[name])
    if (field) document.getElementById(`product-${field}`)?.focus()
  }, [errors])

  function set<K extends keyof Values>(name: K, value: Values[K]) {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current }
        delete next[name]
        return next
      })
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = productFormSchema.safeParse(values)
    focusNext.current = true
    if (!parsed.success) {
      setErrors(productFieldErrors(parsed.error))
      return
    }
    setErrors({})
    setSubmitted(values)
    startTransition(() => dispatch({ ...(product ?? {}), values }))
  }

  const describedBy = (name: ProductField) =>
    errors[name] ? `product-${name}-error` : undefined
  const invalid = (name: ProductField) => (errors[name] ? true : undefined)

  const discount = formDiscountPercent(values.price, values.oldPrice)
  const homepageFull = values.isFeatured && values.isActive && featuredElsewhere >= HOMEPAGE_FEATURED_LIMIT
  const hiddenCategory = categories.find((c) => c.id === values.categoryId && !c.isActive)

  return (
    <div className="pb-24">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          {media}
          <Card title="Основне">
            <Field name="name" label="Назва" error={errors.name}>
              <Input
                id="product-name"
                value={values.name}
                onChange={(event) => set("name", event.target.value)}
                maxLength={PRODUCT_LIMITS.nameMax}
                aria-invalid={invalid("name")}
                aria-describedby={describedBy("name")}
                className={inputClass}
              />
            </Field>

            <Field
              name="categoryId"
              label="Категорія"
              error={errors.categoryId}
              hint={hiddenCategory ? "Ця категорія прихована, тож товару на сайті не буде видно." : undefined}
            >
              <select
                id="product-categoryId"
                value={values.categoryId}
                onChange={(event) => set("categoryId", event.target.value)}
                aria-invalid={invalid("categoryId")}
                aria-describedby={describedBy("categoryId") ?? (hiddenCategory ? "product-categoryId-hint" : undefined)}
                className="h-10 w-full rounded-lg border border-input bg-card px-2.5 text-[0.9375rem] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
              >
                <option value="" disabled>
                  Оберіть категорію
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.isActive ? "" : " (прихована)"}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              name="composition"
              label="Коротко про склад"
              hint="Один рядок під назвою на картці товару, наприклад: «Півонії, троянди, евкаліпт»"
              error={errors.composition}
            >
              <Input
                id="product-composition"
                value={values.composition}
                onChange={(event) => set("composition", event.target.value)}
                maxLength={PRODUCT_LIMITS.compositionMax}
                aria-invalid={invalid("composition")}
                aria-describedby={describedBy("composition") ?? "product-composition-hint"}
                className={inputClass}
              />
            </Field>

            <Field name="description" label="Опис" error={errors.description}>
              <textarea
                id="product-description"
                rows={6}
                value={values.description}
                onChange={(event) => set("description", event.target.value)}
                maxLength={PRODUCT_LIMITS.descriptionMax}
                aria-invalid={invalid("description")}
                aria-describedby={describedBy("description")}
                className={textareaClass}
              />
            </Field>
          </Card>

          <Card title="Деталі на сторінці товару" description="Кожен пункт з нового рядка. Порожні поля на сайті не показуються.">
            <Field name="stems" label="Склад повністю" hint="Наприклад: «Півонія Sarah Bernhardt — 7»" error={errors.stems}>
              <textarea
                id="product-stems"
                rows={5}
                value={values.stems}
                onChange={(event) => set("stems", event.target.value)}
                aria-invalid={invalid("stems")}
                aria-describedby={describedBy("stems") ?? "product-stems-hint"}
                className={textareaClass}
              />
            </Field>
            <Field name="careInstructions" label="Догляд" error={errors.careInstructions}>
              <textarea
                id="product-careInstructions"
                rows={4}
                value={values.careInstructions}
                onChange={(event) => set("careInstructions", event.target.value)}
                aria-invalid={invalid("careInstructions")}
                aria-describedby={describedBy("careInstructions")}
                className={textareaClass}
              />
            </Field>
            <Field name="size" label="Розмір" hint="Наприклад: «Висота 45 см, діаметр 35 см»" error={errors.size}>
              <Input
                id="product-size"
                value={values.size}
                onChange={(event) => set("size", event.target.value)}
                maxLength={PRODUCT_LIMITS.sizeMax}
                aria-invalid={invalid("size")}
                aria-describedby={describedBy("size") ?? "product-size-hint"}
                className={inputClass}
              />
            </Field>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Показ на сайті">
            <Check
              checked={values.isActive}
              onChange={(checked) => set("isActive", checked)}
              label="Показувати на сайті"
              hint="Зніміть, щоб тимчасово прибрати товар з каталогу. В адмінці й у замовленнях він залишиться."
            />
          </Card>

          <Card title="Ціна">
            <Field name="price" label="Ціна, ₴" error={errors.price}>
              <Input
                id="product-price"
                inputMode="decimal"
                value={values.price}
                onChange={(event) => set("price", event.target.value)}
                aria-invalid={invalid("price")}
                aria-describedby={describedBy("price")}
                className={cn(inputClass, "tabular-nums")}
              />
            </Field>
            <Field
              name="oldPrice"
              label="Стара ціна, ₴"
              hint={discount ? `Знижка −${discount}%: на сайті стара ціна буде закреслена` : "Заповніть, щоб показати знижку. Порожнє поле означає без знижки"}
              error={errors.oldPrice}
            >
              <Input
                id="product-oldPrice"
                inputMode="decimal"
                value={values.oldPrice}
                onChange={(event) => set("oldPrice", event.target.value)}
                aria-invalid={invalid("oldPrice")}
                aria-describedby={describedBy("oldPrice") ?? "product-oldPrice-hint"}
                className={cn(inputClass, "tabular-nums")}
              />
            </Field>
          </Card>

          <Card title="Наявність">
            <fieldset className="space-y-3" aria-describedby={errors.availability ? "product-availability-error" : undefined}>
              <legend className="sr-only">Наявність</legend>
              {PRODUCT_AVAILABILITIES.map((value) => (
                <label key={value} className="flex cursor-pointer gap-3">
                  <input
                    type="radio"
                    name="availability"
                    id={value === values.availability ? "product-availability" : undefined}
                    value={value}
                    checked={values.availability === value}
                    onChange={() => set("availability", value)}
                    className="mt-0.5 size-4 shrink-0 accent-moss"
                  />
                  <span>
                    <span className="block text-[0.9375rem] text-ink">{PRODUCT_AVAILABILITY_LABELS[value]}</span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">{AVAILABILITY_HINTS[value]}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            {errors.availability ? (
              <p id="product-availability-error" className="text-sm text-destructive">
                {errors.availability}
              </p>
            ) : null}
            {values.availability === "PREORDER" ? (
              <Field name="leadTimeDays" label="Строк, днів" hint="Скільки днів потрібно, щоб привезти квіти" error={errors.leadTimeDays}>
                <Input
                  id="product-leadTimeDays"
                  inputMode="numeric"
                  value={values.leadTimeDays}
                  onChange={(event) => set("leadTimeDays", event.target.value)}
                  aria-invalid={invalid("leadTimeDays")}
                  aria-describedby={describedBy("leadTimeDays") ?? "product-leadTimeDays-hint"}
                  className={cn(inputClass, "w-28 tabular-nums")}
                />
              </Field>
            ) : null}
          </Card>

          <Card title="Позначки">
            <Check
              checked={values.isPopular}
              onChange={(checked) => set("isPopular", checked)}
              label="Популярне"
              hint="Бейдж на картці; такі товари йдуть першими в каталозі"
            />
            <Check
              checked={values.isNew}
              onChange={(checked) => set("isNew", checked)}
              label="Новинка"
              hint="Бейдж на картці; йдуть одразу після популярних"
            />
            <Check
              checked={values.isFeatured}
              onChange={(checked) => set("isFeatured", checked)}
              label="На головній"
              hint={`Блок популярних букетів на головній, до ${HOMEPAGE_FEATURED_LIMIT} товарів`}
            />
            {homepageFull ? (
              <p className="rounded-xl bg-petal/60 p-3 text-sm leading-relaxed text-ink">
                На головній уже позначено {featuredElsewhere}{" "}
                {plural(featuredElsewhere, ["інший товар", "інші товари", "інших товарів"])}, а показуються лише{" "}
                {HOMEPAGE_FEATURED_LIMIT}: перші за порядком каталогу. Зніміть позначку з іншого товару, щоб цей точно потрапив на головну.
              </p>
            ) : null}
          </Card>

          {aside}
        </div>
      </div>

      <form onSubmit={submit} noValidate className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Button type="submit" disabled={pending || (Boolean(product) && !dirty)}>
            {pending ? "Зберігаємо…" : product ? "Зберегти зміни" : "Створити товар"}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/products">{product ? "До списку" : "Скасувати"}</Link>
          </Button>
          <div role="status" className="min-w-0 flex-1 text-sm">
            {pending ? null : showServerError ? (
              <span className="text-destructive">
                {state?.message}
                {state?.stale ? (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => {
                        discarding.current = true
                        window.location.reload()
                      }}
                      className="text-ink underline underline-offset-4"
                    >
                      Відкрити актуальну версію
                    </button>
                  </>
                ) : null}
              </span>
            ) : Object.keys(errors).length ? (
              <span className="text-destructive">Перевірте поля форми.</span>
            ) : dirty ? (
              <span className="text-ink-soft">Є незбережені зміни</span>
            ) : state?.ok ? (
              <span className="text-stem">{state.message}</span>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  )
}
