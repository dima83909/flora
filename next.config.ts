import type { NextConfig } from "next"

/*
 * Response headers for every route. A full Content-Security-Policy is deliberately not
 * set here: it needs per-request nonces for Next's inline scripts, so it is a separate
 * change. `frame-ancestors` alone is safe and stops the site (admin panel included)
 * from being embedded in another page.
 */
const securityHeaders = [
  // Browsers ignore HSTS over plain HTTP, so local development is unaffected
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
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
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Vercel answers optimized photos with `max-age=0, must-revalidate`, so a card created after a
        // filter change waits for a revalidation round trip and flashes empty. Let browsers reuse them.
        source: "/_next/image",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ]
  },
}

export default nextConfig
