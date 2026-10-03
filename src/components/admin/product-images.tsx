"use client"

import Image from "next/image"
import { useRef, useState, useTransition } from "react"
import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  isProductImageType,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MAX_SIDE,
  PRODUCT_IMAGES_MAX,
} from "@/lib/product-images"
import { cn } from "@/lib/utils"
import { removeProductImage, reorderProductImages, uploadProductImage } from "@/app/admin/(panel)/products/actions"

type ProductImage = { id: string; url: string }

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * Shrinks a photo to PRODUCT_IMAGE_MAX_SIDE and re-encodes it as WebP (JPEG where the
 * browser cannot write WebP). A phone photo of 5–10 MB becomes a few hundred KB, which
 * keeps uploads fast and well under the server's request limit.
 */
async function compress(file: File): Promise<File> {
  // Applies the EXIF rotation, so portrait phone photos stay upright
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  const scale = Math.min(1, PRODUCT_IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is not available")
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  let blob = await canvasToBlob(canvas, "image/webp", 0.85)
  // Browsers that cannot encode WebP silently return PNG
  if (!blob || blob.type !== "image/webp") blob = await canvasToBlob(canvas, "image/jpeg", 0.85)
  if (!blob) throw new Error("Could not encode the photo")
  const extension = blob.type === "image/webp" ? "webp" : "jpg"
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "photo"}.${extension}`, { type: blob.type })
}

async function prepare(file: File): Promise<File | string> {
  try {
    return await compress(file)
  } catch {
    // The browser cannot read this format (e.g. HEIC outside Safari); send it as is if the server accepts it
    if (isProductImageType(file.type) && file.size <= PRODUCT_IMAGE_MAX_BYTES) return file
    return "браузер не зміг прочитати фото. Збережіть його як JPEG і спробуйте ще раз"
  }
}

/**
 * The product's gallery. Changes are saved straight away, separately from the
 * product form; the page re-renders with the stored photos after each one.
 */
export function ProductImages({ productId, images }: { productId: string; images: ProductImage[] }) {
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const busy = pending || progress !== null
  const room = PRODUCT_IMAGES_MAX - images.length

  async function upload(files: File[]) {
    const problems: string[] = []
    if (files.length > room) {
      problems.push(`Можна додати ще ${room} фото, решту пропущено.`)
      files = files.slice(0, room)
    }
    for (const [index, file] of files.entries()) {
      setProgress(files.length > 1 ? `Завантажуємо ${index + 1} з ${files.length}…` : "Завантажуємо фото…")
      const prepared = await prepare(file)
      if (typeof prepared === "string") {
        problems.push(`«${file.name}»: ${prepared}.`)
        continue
      }
      const body = new FormData()
      body.set("productId", productId)
      body.set("file", prepared)
      try {
        const result = await uploadProductImage(body)
        if (!result.ok) problems.push(`«${file.name}»: ${result.message}`)
      } catch {
        problems.push(`«${file.name}»: немає зв'язку із сервером.`)
      }
    }
    setProgress(null)
    setErrors(problems)
  }

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    setErrors([])
    startTransition(async () => {
      const result = await action()
      if (!result.ok && result.message) setErrors([result.message])
    })
  }

  function move(index: number, by: -1 | 1) {
    const order = images.map((image) => image.id)
    const [moved] = order.splice(index, 1)
    order.splice(index + by, 0, moved)
    run(() => reorderProductImages(productId, order))
  }

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6" aria-busy={busy}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-sans text-base font-medium text-ink">Фото</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Перше фото показується на картці товару. Зберігаються одразу, окремо від кнопки «Зберегти».
          </p>
        </div>
        <Button type="button" variant="outline" disabled={busy || room <= 0} onClick={() => input.current?.click()}>
          <ImagePlusIcon aria-hidden />
          Додати фото
        </Button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            const files = [...(event.target.files ?? [])]
            event.target.value = ""
            if (files.length) void upload(files)
          }}
        />
      </div>

      {images.length ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="group relative">
              <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-linen">
                <Image
                  src={image.url}
                  alt={`Фото ${index + 1}`}
                  fill
                  sizes="(min-width: 768px) 12rem, 45vw"
                  loading={index === 0 ? "eager" : undefined}
                  className="object-cover"
                />
                {index === 0 ? (
                  <span className="absolute top-2 left-2 rounded-full bg-paper/95 px-2 py-0.5 text-xs font-medium text-ink">
                    Головне
                  </span>
                ) : null}
              </div>
              {confirmDelete === image.id ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => {
                      setConfirmDelete(null)
                      run(() => removeProductImage(productId, image.id))
                    }}
                  >
                    Видалити
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmDelete(null)}>
                    Ні
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Перемістити фото ${index + 1} ліворуч`}
                  >
                    <ArrowLeftIcon aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={busy || index === images.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`Перемістити фото ${index + 1} праворуч`}
                  >
                    <ArrowRightIcon aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setConfirmDelete(image.id)}
                    aria-label={`Видалити фото ${index + 1}`}
                    className="ml-auto text-muted-foreground hover:text-destructive"
                  >
                    <Trash2Icon aria-hidden />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 text-sm text-ink-soft transition-colors hover:bg-linen/50"
        >
          <ImagePlusIcon aria-hidden className="size-6 text-muted-foreground" />
          Фото ще немає. На сайті поки показується ілюстрація.
        </button>
      )}

      <div role="status" className={cn("mt-3 space-y-1 text-sm", errors.length ? "text-destructive" : "text-ink-soft")}>
        {progress ?? (pending ? "Зберігаємо…" : errors.map((error) => <p key={error}>{error}</p>))}
      </div>
      {room <= 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">Це максимум: {PRODUCT_IMAGES_MAX} фото на товар.</p>
      ) : null}
    </section>
  )
}
