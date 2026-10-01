"use client"

import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { ORDER_STATUS_TRANSITIONS, type OrderStatusValue } from "@/lib/order-status"
import { changeOrderStatus } from "@/app/admin/(panel)/orders/actions"

const actionLabels: Partial<Record<OrderStatusValue, string>> = {
  CONTACTED: "Зв'язалися з клієнтом",
  CONFIRMED: "Підтвердити замовлення",
  COMPLETED: "Позначити виконаним",
  CANCELLED: "Скасувати замовлення",
}

/** Shows only the moves allowed from the current status; the server checks them again */
export function StatusActions({ number, status }: { number: number; status: OrderStatusValue }) {
  const [state, action, pending] = useActionState(changeOrderStatus, null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const next = ORDER_STATUS_TRANSITIONS[status]

  if (next.length === 0) {
    return <p className="text-sm text-ink-soft">Це кінцевий статус, змінити його вже не можна.</p>
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="number" value={number} />
      <input type="hidden" name="from" value={status} />
      <div className="flex flex-wrap gap-2">
        {next
          .filter((to) => to !== "CANCELLED")
          .map((to) => (
            <Button key={to} type="submit" name="to" value={to} disabled={pending}>
              {actionLabels[to]}
            </Button>
          ))}
        {confirmingCancel ? (
          <div className="flex w-full flex-wrap items-center gap-2 rounded-xl bg-destructive/5 p-3">
            <p className="w-full text-sm text-ink">Скасувати замовлення? Повернути його в роботу не вийде.</p>
            <Button type="submit" name="to" value="CANCELLED" variant="destructive" disabled={pending}>
              Так, скасувати
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmingCancel(false)} disabled={pending}>
              Ні, залишити
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={() => setConfirmingCancel(true)} disabled={pending}>
            {actionLabels.CANCELLED}
          </Button>
        )}
      </div>
      <p role="status" className={state?.ok === false ? "text-sm text-destructive" : "text-sm text-stem"}>
        {pending ? "Зберігаємо…" : state?.message}
      </p>
    </form>
  )
}
