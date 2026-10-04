import Link from "next/link"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

function Sprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" className={className} aria-hidden>
      <path d="M12 31 C12 22 12 14 12 4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <ellipse cx="12" cy="4.5" rx="3.2" ry="4.2" fill="var(--blush)" />
      <path d="M12 24 q-7 -2 -8 -9 q6 1 8 9z" fill="var(--stem)" />
      <path d="M12 17 q6 -1 8 -8 q-6 1 -8 8z" fill="var(--stem)" opacity="0.75" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} — на головну`}
      className={cn("relative inline-flex items-end gap-1.5 text-ink after:absolute after:-inset-y-2 after:inset-x-0", className)}
    >
      <Sprig className="h-7 w-5 text-moss" />
      <span className="font-heading text-[1.65rem] leading-none font-light tracking-[-0.02em]">
        {siteConfig.name.toLowerCase()}
      </span>
    </Link>
  )
}
