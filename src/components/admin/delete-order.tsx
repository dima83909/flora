"use client"

import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import type { OrderStatusValue } from "@/lib/order-status"
import { deleteOrder } from "@/app/admin/(panel)/orders/actions"

/** Two-step permanent deletion; the server checks the admin session and the status again */
export function DeleteOrder({ number, status }: { number: number; status: OrderStatusValue }) {
  const [state, action, pending] = useActionState(deleteOrder, null)
  const [confirming, setConfirming] = useState(false)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="number" value={number} />
      <input type="hidden" name="status" value={status} />
      {confirming ? (
        <div className="space-y-3 rounded-xl bg-destructive/5 p-3">
          <p className="text-sm text-ink">
            Видалити замовлення № {number} назавжди? Його не буде в списку, і відновити його не вийде.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Видаляємо…" : "Так, видалити"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
              Ні, залишити
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
          Видалити замовлення
        </Button>
      )}
      <p role="status" className="text-sm text-destructive">
        {pending ? null : state?.message}
      </p>
    </form>
  )
}
