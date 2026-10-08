import { NextResponse, type NextRequest } from "next/server"

import { isRecordId } from "@/lib/ids"
import { PRODUCT_IMAGE_MAX_BYTES } from "@/lib/product-images"
import { getCurrentAdmin } from "@/server/admin/auth"
import { addAdminProductImage } from "@/server/admin/products"

/*
 * Uploads one product photo. A route handler rather than a server action, so its
 * larger body limit applies to this endpoint only: server actions, the public
 * checkout among them, keep Next's default 1 MB cap.
 *
 * The session cookie is SameSite=Lax, so a cross-site form cannot post here with it;
 * the Origin check below is a second line of defence.
 */

/** One photo plus multipart overhead; Vercel functions accept at most 4.5 MB */
const MAX_BODY_BYTES = PRODUCT_IMAGE_MAX_BYTES + 64 * 1024

const reply = (status: number, message?: string) =>
  NextResponse.json({ ok: status === 200, ...(message ? { message } : {}) }, { status })

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  return origin !== null && origin === request.nextUrl.origin
}

export async function POST(request: NextRequest, { params }: RouteContext<"/admin/products/[id]/photos">) {
  if (!sameOrigin(request)) return reply(403, "Некоректний запит.")
  // A fetch() would follow requireAdmin's redirect to the sign-in page, so answer plainly instead
  if (!(await getCurrentAdmin())) return reply(401, "Сесія завершилася. Оновіть сторінку й увійдіть знову.")

  const { id } = await params
  if (!isRecordId(id)) return reply(400, "Некоректний запит.")
  const length = Number(request.headers.get("content-length"))
  if (!length || length > MAX_BODY_BYTES) return reply(413, "Фото завелике навіть після стиснення.")

  let file: FormDataEntryValue | null
  try {
    file = (await request.formData()).get("file")
  } catch {
    return reply(400, "Файл не отримано. Спробуйте ще раз.")
  }

  try {
    const result = await addAdminProductImage(id, file)
    if (result.ok) return reply(200)
    return reply(result.reason === "not_found" ? 404 : 422, result.reason === "not_found" ? "Товар уже видалено." : result.message)
  } catch (error) {
    console.error("Failed to upload a product photo", error)
    return reply(500, "Не вдалося зберегти фото. Спробуйте ще раз за хвилину.")
  }
}
