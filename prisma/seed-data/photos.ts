import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

/**
 * Seed photographs. Their files live in Vercel Blob; photos.json maps each original path
 * (/images/products/<slug>/main.webp) to its Blob URL and is written by
 * `npm run photos:upload-seed`. Before that has run, the files in public/images/products/<slug>/
 * are used, so the database never points at a missing image.
 */
const PHOTO_FILES = ["main.webp", "detail-1.webp", "detail-2.webp"]

const manifestPath = path.join(process.cwd(), "prisma/seed-data/photos.json")

export function readPhotoManifest(): Record<string, string> {
  return existsSync(manifestPath) ? (JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, string>) : {}
}

/** Photos of one product, main image first */
export function seedPhotos(slug: string) {
  const manifest = readPhotoManifest()
  return PHOTO_FILES.flatMap((file) => {
    const legacy = `/images/products/${slug}/${file}`
    if (manifest[legacy]) return [manifest[legacy]]
    return existsSync(path.join(process.cwd(), "public", legacy)) ? [legacy] : []
  })
}
