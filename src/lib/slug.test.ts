import { describe, expect, it } from "vitest"

import { slugify, SLUG_MAX_LENGTH, transliterate } from "@/lib/slug"

describe("transliterate", () => {
  it.each([
    ["Ранок у Провансі", "ranok u provansi"],
    ["Осінній сад", "osinnii sad"],
    ["Ягідний сорбет", "yahidnyi sorbet"],
    ["Юлія Їжакевич", "yuliia yizhakevych"],
    ["Йосипівка", "yosypivka"],
    ["Згорани", "zghorany"],
    ["Щастя", "shchastia"],
    ["Подвір'я", "podviria"],
    ["Ґанок", "ganok"],
  ])("%s → %s", (input, expected) => {
    expect(transliterate(input)).toBe(expected)
  })
})

describe("slugify", () => {
  it("makes a Latin, hyphenated URL segment", () => {
    expect(slugify("  Коробка «Пудра» ")).toBe("korobka-pudra")
    expect(slugify("25 червоних троянд")).toBe("25-chervonykh-troiand")
    expect(slugify("Півонії Sarah Bernhardt")).toBe("pivonii-sarah-bernhardt")
    expect(slugify("Café crème")).toBe("cafe-creme")
  })

  it("returns an empty string when nothing is left", () => {
    expect(slugify("«—»")).toBe("")
  })

  it("cuts long names at a word boundary", () => {
    const slug = slugify("дуже ".repeat(40))
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH)
    expect(slug.endsWith("-")).toBe(false)
    expect(slug.endsWith("duzhe")).toBe(true)
  })

  it("always produces a valid slug", () => {
    for (const name of ["Ранок у Провансі", "Коробка «Вершки»", "A  b -- c", "Ягідний джем №2"]) {
      expect(slugify(name)).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    }
  })
})
