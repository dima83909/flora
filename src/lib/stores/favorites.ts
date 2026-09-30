"use client"

import { createStore } from "@/lib/stores/create-store"

const EMPTY: string[] = []

const favoritesStore = createStore<string[]>(EMPTY, {
  storageKey: "flora.favorites.v1",
  parse: (raw) => (Array.isArray(raw) ? raw.filter((s): s is string => typeof s === "string") : EMPTY),
})

export function toggleFavorite(slug: string) {
  favoritesStore.setState((list) => (list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]))
}

export function useFavorites() {
  return favoritesStore.useStore((list) => list)
}

export function useIsFavorite(slug: string) {
  return favoritesStore.useStore((list) => list.includes(slug))
}
