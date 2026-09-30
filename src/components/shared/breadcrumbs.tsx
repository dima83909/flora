import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

export type Crumb = { name: string; href: string }

/** Visible breadcrumb trail plus matching BreadcrumbList structured data */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.href, siteConfig.url).toString(),
    })),
  }

  return (
    <nav aria-label="Навігаційний ланцюжок" className={cn("text-sm text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li key={item.href} className="flex min-w-0 items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="truncate text-ink-soft">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link href={item.href} className="transition-colors hover:text-ink">
                    {item.name}
                  </Link>
                  <ChevronRightIcon aria-hidden className="size-3.5 shrink-0" />
                </>
              )}
            </li>
          )
        })}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </nav>
  )
}
