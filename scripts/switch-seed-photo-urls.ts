/**
 * Points product photos and category tiles in the database at their Blob copies, after `photos:upload-seed`.
 *
 *   npm run photos:switch-seed-urls
 *
 * Rewrites only rows whose url is still a /images/products/... path found in
 * prisma/seed-data/photos.json (category tiles reuse product photos); photos uploaded in the
 * admin panel are left alone.
 * Safe to re-run. Targets the database in DATABASE_URL.
 */
import "dotenv/config"

import { getDb } from "@/server/db"
import { readPhotoManifest } from "../prisma/seed-data/photos"

async function main() {
  const manifest = readPhotoManifest()
  if (!Object.keys(manifest).length) throw new Error("prisma/seed-data/photos.json is empty: run photos:upload-seed first")

  const db = getDb()
  const rows = await db.productImage.findMany({ where: { url: { startsWith: "/images/products/" } }, select: { id: true, url: true } })
  let switched = 0
  for (const row of rows) {
    const next = manifest[row.url]
    if (!next) {
      console.warn("no Blob copy for", row.url)
      continue
    }
    await db.productImage.update({ where: { id: row.id }, data: { url: next } })
    switched++
  }
  console.log(`Switched ${switched} of ${rows.length} photos to Blob`)

  const categories = await db.category.findMany({ where: { imageUrl: { startsWith: "/images/products/" } }, select: { id: true, imageUrl: true } })
  let tiles = 0
  for (const category of categories) {
    const next = manifest[category.imageUrl!]
    if (!next) {
      console.warn("no Blob copy for category image", category.imageUrl)
      continue
    }
    await db.category.update({ where: { id: category.id }, data: { imageUrl: next } })
    tiles++
  }
  console.log(`Switched ${tiles} of ${categories.length} category images to Blob`)
  await db.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
