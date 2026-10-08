/**
 * Creates missing card thumbnails: for photos stored before thumbnails existed, or whose
 * thumbnail failed during an upload (the upload itself still succeeds).
 *
 *   npm run photos:backfill-cards
 *
 * For every product photo in Blob it checks whether the thumbnail is there and, if not,
 * downloads the original, resizes it and uploads the result next to it. Safe to re-run.
 * Until it has run, cards fall back to the original photo, so nothing is broken meanwhile.
 */
import "dotenv/config"

import { put } from "@vercel/blob"

import { cardImageUrl, isStoredInBlob } from "@/lib/product-images"
import { makeCardImage } from "@/server/catalog/images"
import { getDb } from "@/server/db"

async function main() {
  const db = getDb()
  const rows = await db.productImage.findMany({ select: { url: true } })
  let created = 0
  let present = 0

  for (const { url } of rows) {
    const card = isStoredInBlob(url) ? cardImageUrl(url) : undefined
    if (!card) continue
    if ((await fetch(card, { method: "HEAD" })).ok) {
      present++
      continue
    }
    const response = await fetch(url)
    if (!response.ok) {
      console.warn("cannot download", url, response.status)
      continue
    }
    const thumbnail = await makeCardImage(await response.blob())
    await put(new URL(card).pathname.slice(1), thumbnail, {
      access: "public",
      contentType: "image/webp",
      cacheControlMaxAge: 60 * 60 * 24 * 365,
      allowOverwrite: true,
    })
    created++
    console.log("created", new URL(card).pathname)
  }
  console.log(`Created ${created} thumbnails, ${present} already existed`)
  await db.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
