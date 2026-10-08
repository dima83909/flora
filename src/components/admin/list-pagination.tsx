import Link from "next/link"

import { Button } from "@/components/ui/button"

type ListPaginationProps = {
  page: number
  pageCount: number
  /** Link to another page of the same list, filters kept */
  href: (page: number) => string
}

/** Newer / older page links under an admin list, newest first; nothing for a single page */
export function ListPagination({ page, pageCount, href }: ListPaginationProps) {
  if (pageCount <= 1) return null
  return (
    <nav aria-label="Сторінки" className="mt-5 flex items-center justify-between gap-3 text-sm">
      {page > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={href(page - 1)}>Новіші</Link>
        </Button>
      ) : (
        <span />
      )}
      <span className="text-ink-soft tabular-nums">
        Сторінка {page} з {pageCount}
      </span>
      {page < pageCount ? (
        <Button asChild variant="outline" size="sm">
          <Link href={href(page + 1)}>Давніші</Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  )
}
