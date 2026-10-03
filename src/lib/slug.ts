/*
 * Product URLs are Latin. Ukrainian names are transliterated with the official
 * Ukrainian national system (Cabinet of Ministers resolution No. 55, 2010), the one
 * used in passports and road signs, so "Ранок у Провансі" becomes "ranok-u-provansi".
 */

/** Letters spelled differently at the start of a word: Є, Ї, Й, Ю, Я */
const wordStart: Record<string, string> = { є: "ye", ї: "yi", й: "y", ю: "yu", я: "ya" }

const letters: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y",
  і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s",
  т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ю: "iu", я: "ia",
  // Not Ukrainian, but they turn up in pasted names
  ё: "io", ы: "y", э: "e",
}

/** Soft sign and apostrophes are dropped */
const silent = new Set(["ь", "ъ", "'", "’", "ʼ", "`"])

export const SLUG_MAX_LENGTH = 80

export function transliterate(text: string) {
  const lower = text.toLowerCase()
  let result = ""
  for (let i = 0; i < lower.length; i++) {
    const char = lower[i]
    if (silent.has(char)) continue
    const previous = lower[i - 1]
    // "Зг" is written "zgh" so it does not read as "ж"
    if (char === "г" && previous === "з") {
      result += "gh"
      continue
    }
    const atWordStart = i === 0 || !/[\p{L}'’ʼ`]/u.test(previous)
    result += (atWordStart && wordStart[char]) || letters[char] || char
  }
  return result
}

/** Latin, lower-case, hyphen-separated; empty when the text has no letters or digits */
export function slugify(text: string) {
  const slug = transliterate(text.normalize("NFC"))
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  if (slug.length <= SLUG_MAX_LENGTH) return slug
  // Cut at a word boundary where possible
  const cut = slug.slice(0, SLUG_MAX_LENGTH + 1)
  const boundary = cut.lastIndexOf("-")
  return (boundary > 0 ? cut.slice(0, boundary) : cut.slice(0, SLUG_MAX_LENGTH)).replace(/-+$/, "")
}
