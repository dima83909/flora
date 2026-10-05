import { describe, expect, it } from "vitest"

import { cardImageUrl, isProductImageType, matchesImageSignature } from "@/lib/product-images"

const bytes = (...parts: (string | number[])[]) =>
  new Uint8Array(parts.flatMap((part) => (typeof part === "string" ? [...part].map((c) => c.charCodeAt(0)) : part)))

describe("matchesImageSignature", () => {
  it("recognises each supported format", () => {
    expect(matchesImageSignature(bytes([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg")).toBe(true)
    expect(matchesImageSignature(bytes([0x89], "PNG", [0x0d, 0x0a]), "image/png")).toBe(true)
    expect(matchesImageSignature(bytes("RIFF", [1, 2, 3, 4], "WEBPVP8 "), "image/webp")).toBe(true)
  })

  it("rejects content that does not match the declared type", () => {
    expect(matchesImageSignature(bytes("<html><body>"), "image/jpeg")).toBe(false)
    expect(matchesImageSignature(bytes([0xff, 0xd8, 0xff, 0xe0]), "image/png")).toBe(false)
    expect(matchesImageSignature(bytes("RIFF", [1, 2, 3, 4], "WAVEfmt "), "image/webp")).toBe(false)
    expect(matchesImageSignature(new Uint8Array(), "image/jpeg")).toBe(false)
  })
})

describe("isProductImageType", () => {
  it("accepts only stored formats", () => {
    expect(isProductImageType("image/webp")).toBe(true)
    expect(isProductImageType("image/heic")).toBe(false)
    expect(isProductImageType("image/svg+xml")).toBe(false)
    expect(isProductImageType("toString")).toBe(false)
  })
})

describe("cardImageUrl", () => {
  const blob = "https://abc123.public.blob.vercel-storage.com/products/pink-peony/0f1e.webp"

  it("names the thumbnail after the photo, as WebP", () => {
    expect(cardImageUrl(blob)).toBe("https://abc123.public.blob.vercel-storage.com/products/pink-peony/0f1e-card.webp")
  })

  it("keeps the original extension out of the thumbnail name", () => {
    expect(cardImageUrl("https://abc123.public.blob.vercel-storage.com/products/x/0f1e.jpg")).toBe(
      "https://abc123.public.blob.vercel-storage.com/products/x/0f1e-card.webp"
    )
  })

  it("is stable when applied to a thumbnail", () => {
    expect(cardImageUrl(cardImageUrl(blob)!)).toBe(cardImageUrl(blob))
  })

  it("has no thumbnail for photos outside Blob or without an extension", () => {
    expect(cardImageUrl("/images/products/pink-peony/main.webp")).toBeUndefined()
    expect(cardImageUrl("https://example.com/a.webp")).toBeUndefined()
    expect(cardImageUrl("https://abc123.public.blob.vercel-storage.com/products/x/noext")).toBeUndefined()
  })
})
