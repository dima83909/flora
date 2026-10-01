/*
 * Legal details of the shop owner, shown on /privacy and /offer.
 *
 * TODO(owner): fill in every field with real data before relying on these pages.
 * Nothing here may be invented. While a field is undefined the pages show a visible
 * "потрібно вказати" marker in its place and are excluded from search indexing.
 */
export const legalDetails = {
  /** Seller as it must appear in the contract: full name of the sole proprietor or company name */
  sellerName: undefined as string | undefined,
  /** Legal form and registration number, e.g. "ФОП, РНОКПП …" or "ТОВ, код ЄДРПОУ …" */
  sellerRegistration: undefined as string | undefined,
  /** Registered or postal address of the seller */
  sellerAddress: undefined as string | undefined,
  /** Official contact for customer and personal-data requests (email or another channel) */
  contact: undefined as string | undefined,
  /** How customers can pay, as agreed in practice with the manager */
  paymentMethods: undefined as string | undefined,
  /** Return and exchange terms the shop actually applies */
  returnsPolicy: undefined as string | undefined,
  /** How long order data is kept */
  dataRetention: undefined as string | undefined,
  /** Date the documents take effect, e.g. "1 листопада 2026 року" */
  effectiveDate: undefined as string | undefined,
} as const

/** True once the owner has filled in every field */
export const legalDetailsComplete = Object.values(legalDetails).every(Boolean)
