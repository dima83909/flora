"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/** False during SSR and hydration, true afterwards; for UI that depends on localStorage */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
