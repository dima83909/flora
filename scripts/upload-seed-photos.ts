/**
 * Moves the seed photographs from public/images/products to Vercel Blob.
 *
 *   npm run photos:upload-seed
 *
 * Each file is uploaded twice (the original and its card thumbnail) under a name that
 * carries a short content hash, so the year-long browser cache can never serve a stale
 * photo. Writes prisma/seed-data/photos.json (original path -> Blob URL), which the seed
 * and `npm run photos:switch-seed-urls` read. Safe to re-run: same content, same names.
 * Needs Blob credentials (see .env.example); it writes to the store they point at.
 */
import "dotenv/config"

import { createHash } from "node:crypto"
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import { put } from "@vercel/blob"

import { makeCardImage } from "@/server/catalog/images"

const root = path.join(process.cwd(), "public/images/products")
const manifestPath = path.join(process.cwd(), "prisma/seed-data/photos.json")
const YEAR = 60 * 60 * 24 * 365

async function upload(pathname: string, file: Blob) {
  const { url } = await put(pathname, file, {
    access: "public",
    contentType: "image/webp",
    cacheControlMaxAge: YEAR,
    allowOverwrite: true,
  })
  return url
}

async function main() {
  const manifest: Record<string, string> = {}

  for (const slug of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
    for (const file of readdirSync(path.join(root, slug)).filter((f) => f.endsWith(".webp")).sort()) {
      const bytes = readFileSync(path.join(root, slug, file))
      const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 8)
      const name = file.replace(/\.webp$/, `.${hash}`)

      const original = new Blob([new Uint8Array(bytes)], { type: "image/webp" })
      const url = await upload(`products/${slug}/${name}.webp`, original)
      await upload(`products/${slug}/${name}-card.webp`, await makeCardImage(original))

      manifest[`/images/products/${slug}/${file}`] = url
      console.log("uploaded", `${slug}/${file}`)
    }
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
  console.log(`Wrote ${Object.keys(manifest).length} photos to prisma/seed-data/photos.json`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
