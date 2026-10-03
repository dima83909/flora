"use client"

import { useEffect } from "react"

/**
 * Drops one-time flags such as ?created=1 from the address once the page has shown
 * them, so a reload, a later save or a bookmark does not repeat the message.
 */
export function ForgetSearchParams() {
  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname)
  }, [])
  return null
}
