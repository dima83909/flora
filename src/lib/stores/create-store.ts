"use client"

import { useSyncExternalStore } from "react"

type Listener = () => void

type StoreOptions<T> = {
  /** localStorage key; omit for in-memory UI state */
  storageKey?: string
  /** Guards against malformed or outdated persisted data */
  parse?: (raw: unknown) => T
}

/**
 * Minimal external store for client-only state.
 * The server snapshot is always the initial value, so SSR and hydration
 * stay consistent; persisted data is applied right after hydration.
 */
export function createStore<T>(initial: T, { storageKey, parse }: StoreOptions<T> = {}) {
  let state = initial
  let loaded = !storageKey
  const listeners = new Set<Listener>()

  function load() {
    if (loaded || typeof window === "undefined") return
    loaded = true
    try {
      const raw = window.localStorage.getItem(storageKey!)
      if (raw) state = parse ? parse(JSON.parse(raw)) : (JSON.parse(raw) as T)
    } catch {
      state = initial
    }
  }

  function getSnapshot() {
    load()
    return state
  }

  function getServerSnapshot() {
    return initial
  }

  function emit() {
    listeners.forEach((listener) => listener())
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== storageKey) return
    loaded = false
    load()
    emit()
  }

  function subscribe(listener: Listener) {
    listeners.add(listener)
    if (storageKey && listeners.size === 1) window.addEventListener("storage", onStorage)
    return () => {
      listeners.delete(listener)
      if (storageKey && listeners.size === 0) window.removeEventListener("storage", onStorage)
    }
  }

  function setState(update: (prev: T) => T) {
    state = update(getSnapshot())
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state))
      } catch {
        // Storage can be unavailable (private mode, quota); keep in-memory state
      }
    }
    emit()
  }

  function useStore<S>(selector: (state: T) => S): S {
    return useSyncExternalStore(
      subscribe,
      () => selector(getSnapshot()),
      () => selector(getServerSnapshot())
    )
  }

  return { getState: getSnapshot, setState, useStore }
}
