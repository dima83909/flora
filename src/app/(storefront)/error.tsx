"use client"

import { ErrorContent } from "@/components/shared/error-content"

/** Errors in storefront pages; renders inside the storefront shell */
export default function StorefrontError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorContent error={error} retry={retry} />
}
