/** Money is stored in minor units (kopiykas) and shown in whole hryvnias. 1 UAH = 100. */
export const MINOR_UNITS_PER_UAH = 100

export function toMinor(uah: number) {
  return Math.round(uah * MINOR_UNITS_PER_UAH)
}

export function fromMinor(minor: number) {
  return minor / MINOR_UNITS_PER_UAH
}
