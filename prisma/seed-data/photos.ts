import { existsSync } from "node:fs"
import path from "node:path"

/**
 * Photographs live in public/images/products/<slug>/. A product gets the files that
 * exist there, main image first, so the database never points at a missing image.
 */
const PHOTO_FILES = ["main.webp", "detail-1.webp", "detail-2.webp"]

export function photosOnDisk(slug: string) {
  return PHOTO_FILES.filter((file) => existsSync(path.join(process.cwd(), "public/images/products", slug, file))).map(
    (file) => `/images/products/${slug}/${file}`
  )
}
