import { FlowerArt, type ArtView } from "@/components/brand/flower-art"
import { GiftArt } from "@/components/brand/gift-art"
import type { ProductVisual } from "@/types/catalog"

type ProductImageProps = {
  visual: ProductVisual
  view?: ArtView
  className?: string
  label?: string
}

/** Single entry point for product imagery; swap the internals for <Image> once photography exists */
export function ProductImage({ visual, view, className, label }: ProductImageProps) {
  if (visual.kind === "gift") {
    return <GiftArt variant={visual.variant} view={view} className={className} label={label} />
  }
  return (
    <FlowerArt
      variant={visual.variant}
      container={visual.container}
      view={view}
      className={className}
      label={label}
    />
  )
}
