"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be blocked; the number stays selectable on the page
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      <span aria-live="polite">{copied ? "Скопійовано" : label}</span>
    </Button>
  )
}
