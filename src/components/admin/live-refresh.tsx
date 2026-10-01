"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { getOrdersVersion } from "@/app/admin/(panel)/orders/actions"

/** How often an open, visible admin page asks whether orders changed */
const POLL_INTERVAL_MS = 10_000

type LiveRefreshProps = {
  /** Fingerprint of the data the server rendered this page from */
  version: string
  /** Watch one order instead of the whole list */
  orderNumber?: number
}

/**
 * Keeps an admin page up to date without a manual reload. It polls a small fingerprint
 * and, when it differs from what the page was rendered with, re-renders the server
 * components in place: the URL (search, filters, page) and form state are untouched.
 * Nothing is requested while the tab is hidden; it checks at once when the tab returns.
 */
export function LiveRefresh({ version, orderNumber }: LiveRefreshProps) {
  const router = useRouter()
  const known = useRef(version)
  const checking = useRef(false)

  // A re-render (ours or after the manager's own action) brings a fresh fingerprint
  useEffect(() => {
    known.current = version
  }, [version])

  useEffect(() => {
    let stopped = false

    async function check() {
      if (stopped || checking.current || document.visibilityState !== "visible") return
      checking.current = true
      try {
        const latest = await getOrdersVersion(orderNumber)
        if (!stopped && latest !== known.current) {
          known.current = latest
          router.refresh()
        }
      } catch {
        // Offline or the server is restarting: try again on the next tick
      } finally {
        checking.current = false
      }
    }

    const timer = setInterval(check, POLL_INTERVAL_MS)
    document.addEventListener("visibilitychange", check)
    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener("visibilitychange", check)
    }
  }, [router, orderNumber])

  return null
}
