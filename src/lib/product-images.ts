/*
 * Product photo rules shared by the admin panel (which compresses photos in the
 * browser before sending them) and the server (which checks them again).
 */

/** Formats stored as uploaded; the browser converts everything else it can read to WebP */
export const PRODUCT_IMAGE_TYPES = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const

export type ProductImageType = keyof typeof PRODUCT_IMAGE_TYPES

export function isProductImageType(value: unknown): value is ProductImageType {
  return typeof value === "string" && Object.hasOwn(PRODUCT_IMAGE_TYPES, value)
}

/** Longest side after compression: enough for a full-width product page on a retina screen */
export const PRODUCT_IMAGE_MAX_SIDE = 1600

/**
 * Upper bound for one photo as sent to the server. Compressed photos are far smaller;
 * the upload route adds room for form overhead and stays under Vercel's 4.5 MB limit.
 */
export const PRODUCT_IMAGE_MAX_BYTES = 3.5 * 1024 * 1024

export const PRODUCT_IMAGES_MAX = 12

/**
 * Checks the first bytes of a file against its declared type, so a renamed HTML or
 * script file is not stored as a "photo".
 */
export function matchesImageSignature(bytes: Uint8Array, type: ProductImageType) {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to))
  switch (type) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    case "image/png":
      return bytes[0] === 0x89 && ascii(1, 4) === "PNG"
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP"
  }
}

/** Width of the card thumbnail: a catalog card is at most ~380 CSS px wide, so this covers a 2x screen */
export const CARD_IMAGE_WIDTH = 800

/** Photos uploaded in the admin panel live in a public Vercel Blob store; seed photos used to live in /public */
export function isStoredInBlob(url: string) {
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com")
  } catch {
    return false
  }
}

/**
 * Where the card thumbnail of a stored photo lives: the same name with `-card` added and a
 * `.webp` extension (thumbnails are always WebP), next to the original. Only Blob photos have one:
 * it is served straight from Blob with a year-long cache, unlike /_next/image, which browsers
 * must revalidate every time.
 */
export function cardImageUrl(url: string) {
  if (!isStoredInBlob(url)) return undefined
  const parsed = new URL(url)
  const match = /^(.*?)(-card)?(\.[a-z0-9]+)$/i.exec(parsed.pathname)
  if (!match) return undefined
  parsed.pathname = `${match[1]}-card.webp`
  return parsed.toString()
}
