import { describe, expect, it } from "vitest"

import {
  formDiscountPercent,
  parsePrice,
  productFieldErrors,
  productFormSchema,
  type ProductFormInput,
} from "@/lib/product-schema"

const valid: ProductFormInput = {
  name: "  Ранок   у Провансі ",
  categoryId: "cat_1",
  composition: "Троянди, лаванда",
  stems: "Троянда — 7\r\n\r\n  Лаванда — 5  \n",
  description: "Перший рядок\r\nДругий рядок\n",
  careInstructions: "",
  size: "  ",
  price: "1 850",
  oldPrice: "",
  availability: "IN_STOCK",
  leadTimeDays: "",
  isNew: true,
  isPopular: false,
  isFeatured: false,
  isActive: true,
}

function errors(input: Partial<ProductFormInput>) {
  const result = productFormSchema.safeParse({ ...valid, ...input })
  return result.success ? {} : productFieldErrors(result.error)
}

describe("parsePrice", () => {
  it.each([
    ["1850", 185000],
    ["1 850", 185000],
    ["1850,5", 185050],
    ["1850.50", 185050],
    ["1 850 ₴", 185000],
    ["1850 грн", 185000],
  ])("%s → %d kopiykas", (input, expected) => {
    expect(parsePrice(input)).toBe(expected)
  })

  it.each(["", "abc", "-100", "1.999", "1e3", "12,34,56"])("rejects %j", (input) => {
    expect(parsePrice(input)).toBeNull()
  })
})

describe("productFormSchema", () => {
  it("normalises a valid form for the database", () => {
    const result = productFormSchema.parse(valid)
    expect(result).toEqual({
      name: "Ранок у Провансі",
      categoryId: "cat_1",
      composition: "Троянди, лаванда",
      stems: ["Троянда — 7", "Лаванда — 5"],
      description: "Перший рядок\nДругий рядок",
      careInstructions: [],
      size: null,
      priceMinor: 185000,
      compareAtPriceMinor: null,
      availability: "IN_STOCK",
      leadTimeDays: null,
      isNew: true,
      isPopular: false,
      isFeatured: false,
      isActive: true,
    })
  })

  it("requires the main fields", () => {
    const result = errors({ name: " ", categoryId: "", composition: "", description: "  ", price: "" })
    expect(Object.keys(result).sort()).toEqual(["categoryId", "composition", "description", "name", "price"])
  })

  it("rejects malformed and non-positive prices", () => {
    expect(errors({ price: "дорого" }).price).toBeDefined()
    expect(errors({ price: "0" }).price).toBeDefined()
    expect(errors({ price: "99999999" }).price).toBeDefined()
    expect(errors({ oldPrice: "abc" }).oldPrice).toBeDefined()
  })

  it("accepts a discount only when the old price is higher", () => {
    expect(productFormSchema.parse({ ...valid, oldPrice: "2 300" }).compareAtPriceMinor).toBe(230000)
    expect(errors({ oldPrice: "1850" }).oldPrice).toBe("Стара ціна має бути більшою за ціну")
    expect(errors({ oldPrice: "1000" }).oldPrice).toBeDefined()
  })

  it("needs a lead time for preorder and drops it otherwise", () => {
    expect(errors({ availability: "PREORDER", leadTimeDays: "" }).leadTimeDays).toBeDefined()
    expect(errors({ availability: "PREORDER", leadTimeDays: "0" }).leadTimeDays).toBeDefined()
    expect(errors({ availability: "PREORDER", leadTimeDays: "2.5" }).leadTimeDays).toBeDefined()
    expect(productFormSchema.parse({ ...valid, availability: "PREORDER", leadTimeDays: " 3 " }).leadTimeDays).toBe(3)
    expect(productFormSchema.parse({ ...valid, availability: "LOW_STOCK", leadTimeDays: "3" }).leadTimeDays).toBeNull()
  })

  it("rejects an unknown availability", () => {
    expect(errors({ availability: "SOLD" as ProductFormInput["availability"] }).availability).toBeDefined()
  })

  it("limits list fields", () => {
    expect(errors({ stems: Array.from({ length: 31 }, (_, i) => `Квітка ${i}`).join("\n") }).stems).toBeDefined()
    expect(errors({ careInstructions: "x".repeat(201) }).careInstructions).toBeDefined()
  })

  it("defaults the check boxes when they are missing", () => {
    const { isNew, isPopular, isFeatured, isActive, ...rest } = valid
    void [isNew, isPopular, isFeatured, isActive]
    expect(productFormSchema.parse(rest)).toMatchObject({ isNew: false, isPopular: false, isFeatured: false, isActive: true })
  })
})

describe("formDiscountPercent", () => {
  it("shows the discount only for a higher old price", () => {
    expect(formDiscountPercent("1500", "2000")).toBe(25)
    expect(formDiscountPercent("2000", "2000")).toBeNull()
    expect(formDiscountPercent("2000", "")).toBeNull()
  })
})
