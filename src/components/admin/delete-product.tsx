"use client"

import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { deleteProduct } from "@/app/admin/(panel)/products/actions"

/** Two-step permanent deletion; the server checks the admin session again */
export function DeleteProduct({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState(deleteProduct, null)
  const [confirming, setConfirming] = useState(false)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      {confirming ? (
        <div className="space-y-3 rounded-xl bg-destructive/5 p-3">
          <p className="text-sm text-ink">
            Видалити «{name}» назавжди? Товар зникне з сайту й адмінки, відновити його не вийде. Замовлення з ним
            залишаться.
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
          Видалити товар
        </Button>
      )}
      <p role="status" className="text-sm text-destructive">
        {pending ? null : state?.message}
      </p>
    </form>
  )
}
