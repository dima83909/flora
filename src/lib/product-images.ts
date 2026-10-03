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
 * the server action body limit (next.config.ts) leaves room for it plus form overhead.
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
