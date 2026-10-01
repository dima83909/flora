/**
 * Renders the brand images used by the App Router metadata files:
 *   src/app/favicon.ico, src/app/apple-icon.png, src/app/opengraph-image.png
 * from src/app/icon.svg and scripts/brand/og-image.svg.
 *
 *   node scripts/brand/generate.mjs
 *
 * Text in the social image is rasterised with fonts installed on the machine
 * (Iowan Old Style / Charter / Georgia, Helvetica Neue), so run it on macOS.
 */
import { readFile, writeFile } from "node:fs/promises"

import sharp from "sharp"

const icon = await readFile("src/app/icon.svg")
const png = (size) => sharp(icon, { density: 72 * (size / 64) * 4 }).resize(size, size).png().toBuffer()

// favicon.ico: an ICO container holding PNG images (supported by every current browser)
const sizes = [16, 32, 48]
const images = await Promise.all(sizes.map(png))
const header = Buffer.alloc(6)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(images.length, 4)
let offset = 6 + 16 * images.length
const entries = images.map((data, index) => {
  const entry = Buffer.alloc(16)
  entry.writeUInt8(sizes[index], 0)
  entry.writeUInt8(sizes[index], 1)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(data.length, 8)
  entry.writeUInt32LE(offset, 12)
  offset += data.length
  return entry
})
await writeFile("src/app/favicon.ico", Buffer.concat([header, ...entries, ...images]))

// Apple touch icon: full-bleed square, iOS rounds the corners itself
const square = Buffer.from(icon.toString().replace('rx="14"', 'rx="0"'))
await sharp(square, { density: 72 * (180 / 64) * 4 }).resize(180, 180).png().toFile("src/app/apple-icon.png")

await sharp(await readFile("scripts/brand/og-image.svg")).resize(1200, 630).png({ compressionLevel: 9 }).toFile("src/app/opengraph-image.png")

console.log("Brand images written to src/app")
