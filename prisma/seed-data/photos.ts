import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

/**
 * Seed photographs. Their files live in the production Vercel Blob store; photos.json maps
 * each photo's original path (/images/products/<slug>/main.webp), kept as a stable key that
 * the fixtures also use for category tiles, to its Blob URL.
 */
const PHOTO_FILES = ["main.webp", "detail-1.webp", "detail-2.webp"]

const manifestPath = path.join(process.cwd(), "prisma/seed-data/photos.json")

export function readPhotoManifest(): Record<string, string> {
  return existsSync(manifestPath) ? (JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, string>) : {}
}

/** Photos of one product, main image first; a product without seed photos gets none */
export function seedPhotos(slug: string) {
  const manifest = readPhotoManifest()
  return PHOTO_FILES.flatMap((file) => {
    const url = manifest[`/images/products/${slug}/${file}`]
    return url ? [url] : []
  })
}
