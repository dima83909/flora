"use client"

import { useRef, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import type { ArtView } from "@/components/brand/flower-art"
import { ProductImage } from "@/components/shop/product-image"
import { cn } from "@/lib/utils"
import type { Product } from "@/types/catalog"

const VIEW_LABELS: Record<ArtView, string> = {
  full: "загальний вигляд",
  close: "квіти крупним планом",
  base: "упаковка",
}

type ProductGalleryProps = {
  product: Pick<Product, "name" | "visual" | "images">
  children?: React.ReactNode
}

type Slide = { key: string; src?: string; view?: ArtView; label: string; thumbLabel: string }

/** Photographs when the product has them; otherwise the illustrated views */
function slidesFor(product: ProductGalleryProps["product"]): Slide[] {
  if (product.images?.length) {
    return product.images.map((src, index) => ({
      key: src,
      src,
      label: index === 0 ? product.name : `${product.name}, фото ${index + 1}`,
      thumbLabel: `Показати фото ${index + 1}`,
    }))
  }
  const views: ArtView[] = product.visual.kind === "gift" ? ["full", "close"] : ["full", "close", "base"]
  return views.map((view, index) => ({
    key: view,
    view,
    label: `${product.name}, ${VIEW_LABELS[view]}`,
    thumbLabel: `Показати фото ${index + 1}: ${VIEW_LABELS[view]}`,
  }))
}

/**
 * Native scroll-snap strip: swipe works on touch without JS gesture handling,
 * thumbnails and arrows scroll it programmatically.
 */
export function ProductGallery({ product, children }: ProductGalleryProps) {
  const slides = slidesFor(product)
  const [active, setActive] = useState(0)
  const stripRef = useRef<HTMLDivElement>(null)

  function goTo(index: number) {
    const strip = stripRef.current
    if (!strip) return
    const clamped = Math.max(0, Math.min(slides.length - 1, index))
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    strip.scrollTo({ left: clamped * strip.clientWidth, behavior: reduceMotion ? "auto" : "smooth" })
  }

  function onScroll() {
    const strip = stripRef.current
    if (!strip) return
    const index = Math.round(strip.scrollLeft / strip.clientWidth)
    if (index !== active) setActive(index)
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-4">
      <div className="relative min-w-0 flex-1">
        <div
          ref={stripRef}
          onScroll={onScroll}
          role="region"
          aria-roledescription="галерея"
          aria-label={`Фото: ${product.name}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") goTo(active + 1)
            if (e.key === "ArrowLeft") goTo(active - 1)
          }}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain md:rounded-3xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide, index) => (
            <div
              key={slide.key}
              className="aspect-4/5 w-full shrink-0 snap-center snap-always bg-linen"
              aria-roledescription="слайд"
              aria-label={`${index + 1} з ${slides.length}`}
            >
              <ProductImage
                visual={product.visual}
                src={slide.src}
                view={slide.view}
                label={slide.label}
                sizes="(min-width: 1024px) 50vw, 100vw"
                preload={index === 0}
              />
            </div>
          ))}
        </div>

        {children}

        <div
          className={cn(
            "pointer-events-none absolute inset-x-3 top-1/2 hidden -translate-y-1/2 justify-between",
            slides.length > 1 && "md:flex"
          )}
        >
          {[
            { dir: -1, label: "Попереднє фото", Icon: ChevronLeftIcon },
            { dir: 1, label: "Наступне фото", Icon: ChevronRightIcon },
          ].map(({ dir, label, Icon }) => {
            const disabled = dir < 0 ? active === 0 : active === slides.length - 1
            return (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => goTo(active + dir)}
                disabled={disabled}
                className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-paper/85 text-ink backdrop-blur-sm transition-opacity hover:bg-paper disabled:opacity-0"
              >
                <Icon className="size-5" />
              </button>
            )
          })}
        </div>

        {/* Position dots for touch screens, where thumbnails may be below the fold */}
        <div
          aria-hidden
          className={cn("absolute inset-x-0 bottom-4 justify-center gap-1.5 md:hidden", slides.length > 1 ? "flex" : "hidden")}
        >
          {slides.map((slide, index) => (
            <span
              key={slide.key}
              className={cn(
                "h-1.5 rounded-full bg-paper/90 transition-all duration-300",
                index === active ? "w-5" : "w-1.5 opacity-60"
              )}
            />
          ))}
        </div>
      </div>

      {/* A single photograph needs no thumbnails */}
      <ul
        className={cn("gap-2.5 px-5 md:px-0 lg:w-20 lg:flex-col lg:gap-3", slides.length > 1 ? "flex" : "hidden")}
        aria-label="Мініатюри"
      >
        {slides.map((slide, index) => (
          <li key={slide.key} className="w-18 lg:w-full">
            <button
              type="button"
              onClick={() => goTo(index)}
              aria-label={slide.thumbLabel}
              aria-current={index === active}
              className={cn(
                "block aspect-4/5 w-full overflow-hidden rounded-xl ring-offset-2 ring-offset-paper transition",
                index === active ? "ring-2 ring-moss" : "opacity-70 hover:opacity-100"
              )}
            >
              <ProductImage visual={product.visual} src={slide.src} view={slide.view} sizes="80px" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
