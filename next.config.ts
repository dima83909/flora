import type { NextConfig } from "next"

/** Product photos are served straight from the public Vercel Blob store (card thumbnails) */
const BLOB_HOST = "https://*.public.blob.vercel-storage.com"

/*
 * Content-Security-Policy without nonces. Next's inline bootstrap scripts need either a
 * per-request nonce or 'unsafe-inline'; nonces would force every page to render per request
 * and give up the static and ISR caching, so scripts stay 'unsafe-inline'. The policy still
 * allows only same-origin scripts, styles, fonts and requests, blocks plugins, <base>
 * hijacking, form posts to other sites and framing. Dev mode also needs eval for Fast Refresh.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${BLOB_HOST}`,
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ")

/* Response headers for every route, the admin panel included */
const securityHeaders = [
  // Browsers ignore HSTS over plain HTTP, so local development is unaffected
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Same protection for browsers that predate CSP frame-ancestors
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig: NextConfig = {
  images: {
    // Product photos uploaded in the admin panel live in a public Vercel Blob store
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/products/**" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
