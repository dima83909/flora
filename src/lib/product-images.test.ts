import { describe, expect, it } from "vitest"

import { isProductImageType, matchesImageSignature } from "@/lib/product-images"

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
