"use client"

import { Logo } from "@/components/brand/logo"
import { ErrorContent } from "@/components/shared/error-content"

/** Errors thrown by the storefront layout itself (it loads the catalogue), so there is no shell here */
export default function RootError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <>
      <header className="container-page pt-6">
        <Logo />
      </header>
      <main id="main" className="flex-1">
        <ErrorContent error={error} retry={retry} />
      </main>
    </>
  )
}
