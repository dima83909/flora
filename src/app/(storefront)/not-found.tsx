import type { Metadata } from "next"

import { NotFoundContent, notFoundMetadata } from "@/components/shared/not-found-content"

export const metadata: Metadata = notFoundMetadata

export default function StorefrontNotFound() {
  return <NotFoundContent />
}
