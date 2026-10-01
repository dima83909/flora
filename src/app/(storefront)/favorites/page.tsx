import type { Metadata } from "next"

import { FavoritesView } from "@/components/favorites/favorites-view"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { canonicalPath } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Обране",
  description: "Букети й подарунки, які ви зберегли на цьому пристрої.",
  alternates: { canonical: canonicalPath("/favorites") },
  // Personal, device-specific list: nothing to index
  robots: { index: false, follow: true },
}

export default function FavoritesPage() {
  return (
    <div className="container-page pt-6 pb-20 md:pt-8 md:pb-28">
      <Breadcrumbs
        items={[
          { name: "Головна", href: "/" },
          { name: "Обране", href: "/favorites" },
        ]}
      />
      <h1 className="mt-6 text-title font-light text-ink md:mt-10">Обране</h1>
      <FavoritesView />
    </div>
  )
}
