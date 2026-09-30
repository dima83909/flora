import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type SectionHeadingProps = {
  id?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function SectionHeading({ id, title, description, action, className }: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-12",
        className
      )}
    >
      <div className="max-w-2xl">
        <h2 id={id} className="text-title font-light text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft md:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
