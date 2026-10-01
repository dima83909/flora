"use client"

import { useState } from "react"
import { ArrowDownUpIcon, CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { sortOptions, type SortValue } from "@/lib/catalog"
import { cn } from "@/lib/utils"

// "Спочатку нові" is not offered while product dates are demo data; ?sort=new links still work
const shownOptions = sortOptions.filter((option) => option.value !== "new")

type SortControlProps = {
  value: SortValue
  onChange: (value: SortValue) => void
}

/** Dropdown on desktop */
export function SortSelect({ value, onChange }: SortControlProps) {
  const current = sortOptions.find((o) => o.value === value)
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortValue)}>
      <SelectTrigger aria-label="Сортування" className="h-11 min-w-56 rounded-full border-input bg-card px-4 text-[0.9375rem]">
        <SelectValue>{current?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" align="end" className="bg-card">
        {shownOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} className="py-2.5 text-[0.9375rem]">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Bottom sheet with large touch targets on mobile */
export function SortSheet({ value, onChange }: SortControlProps) {
  const [open, setOpen] = useState(false)
  const current = sortOptions.find((o) => o.value === value)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg" className="h-11 min-w-0 flex-[1.4] justify-start bg-card px-4 text-[0.9375rem] font-normal">
          <ArrowDownUpIcon data-icon="inline-start" className="text-stem" />
          <span className="truncate">
            <span className="sr-only">Сортування: </span>
            {current?.short}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="gap-0 rounded-t-3xl bg-paper px-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="font-heading text-2xl font-light">Сортування</SheetTitle>
          <SheetDescription className="sr-only">Оберіть порядок товарів</SheetDescription>
        </SheetHeader>
        <ul className="px-3">
          {shownOptions.map((option) => {
            const active = option.value === value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex min-h-14 w-full items-center justify-between rounded-2xl px-3 text-left text-base text-ink transition-colors hover:bg-linen",
                    active && "bg-linen font-medium"
                  )}
                >
                  {option.label}
                  {active ? <CheckIcon className="size-5 text-moss" /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
