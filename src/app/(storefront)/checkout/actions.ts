"use server"

import { getClientIp } from "@/server/client-ip"
import { createGuestOrder, type CreateOrderResult } from "@/server/orders/create-order"

/**
 * Places a guest order. Input comes straight from the browser, so it is typed as
 * unknown and fully validated (and re-priced) on the server.
 */
export async function placeOrder(input: unknown): Promise<CreateOrderResult> {
  return createGuestOrder(input, { ip: await getClientIp() })
}
