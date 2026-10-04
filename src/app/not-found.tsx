import type { Metadata } from "next"

import { StorefrontShell } from "@/components/layout/storefront-shell"
import { NotFoundContent, notFoundMetadata } from "@/components/shared/not-found-content"

export const metadata: Metadata = notFoundMetadata

export default function NotFound() {
  return (
    <StorefrontShell>
      <NotFoundContent />
    </StorefrontShell>
  )
}
