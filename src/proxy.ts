import { NextResponse, type NextRequest } from "next/server"

/**
 * Answers 400 to addresses with broken percent-encoding (/bouquets/%E0%A4, /bouquets/%25).
 * Next decodes dynamic route params once more after decoding the path, and in the App
 * Router the resulting error escapes as a 500. Real links never contain such sequences:
 * slugs are Latin and order numbers are digits.
 */
export function proxy(request: NextRequest) {
  try {
    decodeURIComponent(decodeURIComponent(request.nextUrl.pathname))
  } catch {
    return new NextResponse("Некоректна адреса сторінки.", {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8" },
    })
  }
  return NextResponse.next()
}

export const config = {
  // Only paths with a percent sign; every other request skips the proxy entirely
  matcher: "/:path(.*%.*)",
}
