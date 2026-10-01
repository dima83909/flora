"use client"

import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { MANAGER_NOTE_MAX } from "@/lib/order-status"
import { saveManagerNote } from "@/app/admin/(panel)/orders/actions"

export function ManagerNoteForm({ number, note }: { number: number; note: string }) {
  const [state, action, pending] = useActionState(saveManagerNote, null)
  const [value, setValue] = useState(note)

  // Live updates: when the saved note changes elsewhere, show it, unless the manager is
  // in the middle of editing, whose unsaved text must not be overwritten
  const [savedNote, setSavedNote] = useState(note)
  if (note !== savedNote) {
    if (value.trim() === savedNote) setValue(note)
    setSavedNote(note)
  }

  return (
    <form action={action}>
      <input type="hidden" name="number" value={number} />
      <label htmlFor="manager-note" className="sr-only">
        Нотатка менеджера
      </label>
      <textarea
        id="manager-note"
        name="note"
        rows={5}
        maxLength={MANAGER_NOTE_MAX}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Про що домовилися: адреса, дата, оплата…"
        className="block w-full resize-y rounded-lg border border-input bg-card px-3 py-2.5 text-[0.9375rem] leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="submit" disabled={pending || value.trim() === note}>
          {pending ? "Зберігаємо…" : "Зберегти нотатку"}
        </Button>
        {/* Errors stay visible; "saved" disappears as soon as the text is edited again */}
        <p role="status" className={state?.ok === false ? "text-sm text-destructive" : "text-sm text-stem"}>
          {pending ? null : state?.ok === false || value.trim() === note ? state?.message : null}
        </p>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {value.length} / {MANAGER_NOTE_MAX}
        </span>
      </div>
    </form>
  )
}
